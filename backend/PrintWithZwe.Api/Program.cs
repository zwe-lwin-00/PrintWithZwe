using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using PrintWithZwe.Api;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["ASPNETCORE_URLS"] ?? "http://127.0.0.1:5000");
builder.WebHost.ConfigureKestrel(options =>
{
	options.AddServerHeader = false;
	options.Limits.MaxRequestBodySize = 12 * 1024 * 1024;
	options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});
var paths = new StoragePaths(Path.GetFullPath(builder.Configuration["Storage:Root"]
	?? Path.Combine(builder.Environment.ContentRootPath, "data")));
Directory.CreateDirectory(paths.Root);
Directory.CreateDirectory(paths.Keys);
Directory.CreateDirectory(paths.Uploads);
builder.Services.AddSingleton(paths);
builder.Services.AddSingleton<ImageStorage>();
builder.Services.AddDbContext<CatalogDb>(options => options.UseSqlite(
	new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder { DataSource = paths.Database, ForeignKeys = true }.ToString()));
builder.Services.AddDataProtection().SetApplicationName("PrintWithZwe")
	.PersistKeysToFileSystem(new DirectoryInfo(paths.Keys));
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
	options.User.RequireUniqueEmail = true;
	options.Password.RequiredLength = 14;
	options.Lockout.MaxFailedAccessAttempts = 5;
	options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddEntityFrameworkStores<CatalogDb>().AddDefaultTokenProviders();
builder.Services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.FromMinutes(5));
builder.Services.ConfigureApplicationCookie(options =>
{
	options.Cookie.Name = builder.Environment.IsDevelopment() ? "pzw-admin" : "__Host-pzw-admin";
	options.Cookie.HttpOnly = true;
	options.Cookie.SameSite = SameSiteMode.Strict;
	options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
	options.ExpireTimeSpan = TimeSpan.FromHours(8);
	options.SlidingExpiration = false;
	options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
	options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthorization(options => options.AddPolicy("Admin", policy => policy.RequireRole("Admin")));
builder.Services.AddAntiforgery(options =>
{
	options.HeaderName = "X-CSRF-TOKEN";
	options.Cookie.Name = builder.Environment.IsDevelopment() ? "pzw-csrf" : "__Host-pzw-csrf";
	options.Cookie.HttpOnly = true;
	options.Cookie.SameSite = SameSiteMode.Strict;
	options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
	options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
	options.ForwardLimit = 1;
});
builder.Services.AddRateLimiter(options =>
{
	options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
	options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
		RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
			_ => new FixedWindowRateLimiterOptions { PermitLimit = 180, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
	options.AddPolicy("login", context => RateLimitPartition.GetFixedWindowLimiter(
		context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
		_ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(5), QueueLimit = 0 }));
	options.AddConcurrencyLimiter("writes", options => { options.PermitLimit = 1; options.QueueLimit = 0; });
});
builder.Services.AddProblemDetails();
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
	var database = scope.ServiceProvider.GetRequiredService<CatalogDb>();
	await database.Database.MigrateAsync();
	await database.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;");
	if (args.Length == 2 && args[0] == "--create-admin")
	{
		await AdminProvisioning.CreateAsync(scope.ServiceProvider, args[1]);
		return;
	}
	if (args.Length == 2 && args[0] == "--reset-admin-mfa")
	{
		await AdminProvisioning.ResetMfaAsync(scope.ServiceProvider, args[1]);
		return;
	}
}
app.UseForwardedHeaders();
app.UseExceptionHandler();
app.Use(async (context, next) =>
{
	context.Response.Headers["X-Content-Type-Options"] = "nosniff";
	context.Response.Headers["X-Frame-Options"] = "DENY";
	context.Response.Headers["Referrer-Policy"] = "same-origin";
	context.Response.Headers["Cache-Control"] = "no-store";
	if (!app.Environment.IsDevelopment() && !context.Request.IsHttps && context.Request.Path != "/api/health")
	{
		context.Response.StatusCode = 400;
		return;
	}
	try { await next(context); }
	catch (CatalogException error)
	{
		context.Response.StatusCode = 400;
		await context.Response.WriteAsJsonAsync(new { ok = false, error = error.Message });
	}
});
if (app.Environment.IsDevelopment())
	app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(paths.Uploads), RequestPath = "/uploads" });
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.Use(async (context, next) =>
{
	if (HttpMethods.IsPost(context.Request.Method) || HttpMethods.IsPut(context.Request.Method) || HttpMethods.IsDelete(context.Request.Method))
	{
		if (!HttpMethods.IsDelete(context.Request.Method) && !context.Request.HasJsonContentType())
		{
			context.Response.StatusCode = 415;
			return;
		}
		try { await context.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context); }
		catch (AntiforgeryValidationException)
		{
			context.Response.StatusCode = 400;
			await context.Response.WriteAsJsonAsync(new { ok = false, error = "Invalid security token. Refresh and retry." });
			return;
		}
	}
	await next(context);
});
app.MapGet("/api/health", () => Results.Ok(new { ok = true }));
app.MapAdminAuth();
app.MapCatalog();
app.MapPricing();
app.Run();

public partial class Program;