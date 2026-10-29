using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using OtpNet;
using PrintWithZwe.Api;
using SkiaSharp;
using Xunit;

namespace PrintWithZwe.Api.Tests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public string EnvironmentName { get; init; } = "Development";
    public string DataRoot { get; } = Path.Combine(Path.GetTempPath(), "pzw-tests-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(EnvironmentName);
        builder.UseSetting("Storage:Root", DataRoot);
        builder.UseSetting("Logging:LogLevel:Default", "Warning");
    }

    public HttpClient Browser() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false
    });
}

public sealed class CatalogTests : IAsyncLifetime
{
    private readonly ApiFactory factory = new();
    private const string Email = "admin@example.test";
    private const string Password = "Test-Only-Password-83!";
    private string authenticatorKey = "";

    public async Task InitializeAsync()
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        Assert.True((await roles.CreateAsync(new IdentityRole("Admin"))).Succeeded);
        var admin = new IdentityUser { UserName = Email, Email = Email };
        Assert.True((await users.CreateAsync(admin, Password)).Succeeded);
        Assert.True((await users.AddToRoleAsync(admin, "Admin")).Succeeded);
        Assert.True((await users.ResetAuthenticatorKeyAsync(admin)).Succeeded);
        authenticatorKey = (await users.GetAuthenticatorKeyAsync(admin))!;
        Assert.True((await users.SetTwoFactorEnabledAsync(admin, true)).Succeeded);
    }

    public async Task DisposeAsync()
    {
        await factory.DisposeAsync();
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        Directory.Delete(factory.DataRoot, recursive: true);
    }

    [Fact]
    public async Task MfaResetReplacesTheKeyAndLocksUntilVerifiedWithoutChangingPassword()
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var admin = (await users.FindByEmailAsync(Email))!;
        var originalStamp = await users.GetSecurityStampAsync(admin);
        var newKey = await AdminProvisioning.BeginMfaResetAsync(users, admin);
        Assert.NotEqual(authenticatorKey, newKey);
        Assert.NotEqual(originalStamp, await users.GetSecurityStampAsync(admin));
        Assert.True(await users.IsLockedOutAsync(admin));
        Assert.False(await users.GetTwoFactorEnabledAsync(admin));
        Assert.True(await users.CheckPasswordAsync(admin, Password));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            AdminProvisioning.ConfirmMfaResetAsync(users, admin, "invalid-code"));
        Assert.True(await users.IsLockedOutAsync(admin));
        var code = new Totp(Base32Encoding.ToBytes(newKey)).ComputeTotp();
        await AdminProvisioning.ConfirmMfaResetAsync(users, admin, code);
        Assert.True(await users.GetTwoFactorEnabledAsync(admin));
        Assert.False(await users.IsLockedOutAsync(admin));
        Assert.True(await users.CheckPasswordAsync(admin, Password));
        authenticatorKey = newKey;
        using var browser = factory.Browser();
        await Login(browser);
    }

    [Fact]
    public async Task PublicCatalogAndHealthAreAccessibleButAdminIsNot()
    {
        using var browser = factory.Browser();
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/api/health")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/api/products")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/api/admin/products")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.PostAsJsonAsync("/api/admin/products", ProductBody())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await browser.GetAsync("/data/catalog.db")).StatusCode);
    }

    [Fact]
    public async Task LoginRequiresCsrfAndMfa()
    {
        using var browser = factory.Browser();
        Assert.Equal(HttpStatusCode.BadRequest,
            (await browser.PostAsJsonAsync("/api/auth/login", new { email = Email, password = Password })).StatusCode);
        await Csrf(browser);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await browser.PostAsJsonAsync("/api/auth/login", new { email = Email, password = Password })).StatusCode);
        await Login(browser);
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync("/api/auth/session")).StatusCode);
    }

    [Fact]
    public async Task AuthenticatedWritesStillRequireCsrf()
    {
        using var browser = factory.Browser();
        await Login(browser);
        browser.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        Assert.Equal(HttpStatusCode.BadRequest,
            (await browser.PostAsJsonAsync("/api/admin/products", ProductBody())).StatusCode);
    }

    [Fact]
    public async Task CatalogRoundTripPersistsImagesEditsArchivesAndLogout()
    {
        using var browser = factory.Browser();
        await Login(browser);
        using var created = await browser.PostAsJsonAsync("/api/admin/products", ProductBody());
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var product = (await created.Content.ReadFromJsonAsync<JsonObject>())!["item"]!;
        var id = product["id"]!.GetValue<string>();
        var imageUrl = product["imageUrl"]!.GetValue<string>();
        Assert.Matches("^/uploads/[a-f0-9]{32}\\.webp$", imageUrl);
        Assert.True(File.Exists(Path.Combine(factory.DataRoot, "uploads", Path.GetFileName(imageUrl))));
        Assert.Equal(HttpStatusCode.OK, (await browser.GetAsync(imageUrl)).StatusCode);

        var update = ProductBody();
        update["title"] = "Updated print";
        update["images"] = new JsonArray();
        update["imageUrls"] = new JsonArray(imageUrl);
        Assert.Equal(HttpStatusCode.OK, (await browser.PutAsJsonAsync("/api/admin/products/" + id, update)).StatusCode);
        using var visitor = factory.Browser();
        var listed = await visitor.GetFromJsonAsync<JsonObject>("/api/products");
        Assert.Equal("Updated print", listed!["items"]![0]!["title"]!.GetValue<string>());
        Assert.Equal(2500.25m, listed["items"]![0]!["price"]!.GetValue<decimal>());

        Assert.Equal(HttpStatusCode.OK, (await browser.DeleteAsync("/api/admin/products/" + id)).StatusCode);
        listed = await visitor.GetFromJsonAsync<JsonObject>("/api/products");
        Assert.Empty(listed!["items"]!.AsArray());
        var adminList = await browser.GetFromJsonAsync<JsonObject>("/api/admin/products");
        Assert.True(adminList!["items"]![0]!["archived"]!.GetValue<bool>());
        Assert.Equal(HttpStatusCode.OK, (await browser.PostAsJsonAsync("/api/auth/logout", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.GetAsync("/api/auth/session")).StatusCode);
    }

    [Fact]
    public async Task RejectsExternalUrlsInvalidPricesAndDisguisedImages()
    {
        using var browser = factory.Browser();
        await Login(browser);
        var external = ProductBody();
        external["images"] = new JsonArray();
        external["imageUrls"] = new JsonArray("https://example.test/image.jpg");
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.PostAsJsonAsync("/api/admin/products", external)).StatusCode);
        var negative = ProductBody();
        negative["price"] = -1;
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.PostAsJsonAsync("/api/admin/products", negative)).StatusCode);
        var disguised = ProductBody();
        disguised["images"]![0]!["data"] = Convert.ToBase64String("<svg onload='alert(1)'/>"u8.ToArray());
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.PostAsJsonAsync("/api/admin/products", disguised)).StatusCode);
        Assert.Empty(Directory.GetFiles(Path.Combine(factory.DataRoot, "uploads")));
    }

    [Fact]
    public async Task RejectsOversizedDimensionsAndCleansUpPartialUploads()
    {
        using var browser = factory.Browser();
        await Login(browser);
        var body = ProductBody();
        var large = Upload(2049, 1);
        body["images"]!.AsArray().Add(large);
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.PostAsJsonAsync("/api/admin/products", body)).StatusCode);
        Assert.Empty(Directory.GetFiles(Path.Combine(factory.DataRoot, "uploads")));
    }

    [Fact]
    public async Task LoginIsRateLimited()
    {
        using var browser = factory.Browser();
        await Csrf(browser);
        for (var attempt = 0; attempt < 5; attempt++)
            await browser.PostAsJsonAsync("/api/auth/login", new { email = Email, password = "wrong" });
        Assert.Equal(HttpStatusCode.TooManyRequests,
            (await browser.PostAsJsonAsync("/api/auth/login", new { email = Email, password = "wrong" })).StatusCode);
    }

    [Fact]
    public async Task ProductionRequiresHttpsAndUsesSecureHostCookies()
    {
        await using var production = new ApiFactory { EnvironmentName = "Production" };
        using var plain = production.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("http://localhost"), AllowAutoRedirect = false
        });
        Assert.Equal(HttpStatusCode.BadRequest, (await plain.GetAsync("/api/products")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await plain.GetAsync("/api/health")).StatusCode);
        using var secure = production.Browser();
        using var response = await secure.GetAsync("/api/auth/csrf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), cookie =>
            cookie.StartsWith("__Host-pzw-csrf=") && cookie.Contains("secure", StringComparison.OrdinalIgnoreCase)
            && cookie.Contains("httponly", StringComparison.OrdinalIgnoreCase));
        await production.DisposeAsync();
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        Directory.Delete(production.DataRoot, recursive: true);
    }

    [Fact]
    public async Task RejectsAnotherProductsImageAndLocksOutRepeatedBadPasswords()
    {
        using var browser = factory.Browser();
        await Login(browser);
        using var created = await browser.PostAsJsonAsync("/api/admin/products", ProductBody());
        var product = (await created.Content.ReadFromJsonAsync<JsonObject>())!["item"]!;
        var stolen = ProductBody();
        stolen["images"] = new JsonArray();
        stolen["imageUrls"] = new JsonArray(product["imageUrl"]!.GetValue<string>());
        Assert.Equal(HttpStatusCode.BadRequest, (await browser.PostAsJsonAsync("/api/admin/products", stolen)).StatusCode);
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var signIn = scope.ServiceProvider.GetRequiredService<SignInManager<IdentityUser>>();
        var admin = (await users.FindByEmailAsync(Email))!;
        for (var attempt = 0; attempt < 5; attempt++)
            await signIn.CheckPasswordSignInAsync(admin, "wrong", lockoutOnFailure: true);
        Assert.True(await users.IsLockedOutAsync(admin));
    }

    [Fact]
    public async Task NormalAccountCannotBecomeAdminByLoggingIn()
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        await users.CreateAsync(new IdentityUser { UserName = "visitor@example.test", Email = "visitor@example.test" }, Password);
        using var browser = factory.Browser();
        await Csrf(browser);
        Assert.Equal(HttpStatusCode.Unauthorized, (await browser.PostAsJsonAsync("/api/auth/login",
            new { email = "visitor@example.test", password = Password })).StatusCode);
    }

    private async Task Login(HttpClient browser)
    {
        await Csrf(browser);
        var code = new Totp(Base32Encoding.ToBytes(authenticatorKey)).ComputeTotp();
        var response = await browser.PostAsJsonAsync("/api/auth/login", new { email = Email, password = Password, code });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookies = response.Headers.GetValues("Set-Cookie");
        Assert.Contains(cookies, cookie => cookie.Contains("httponly", StringComparison.OrdinalIgnoreCase));
        await Csrf(browser);
    }

    private static async Task Csrf(HttpClient browser)
    {
        browser.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        var response = await browser.GetFromJsonAsync<JsonObject>("/api/auth/csrf");
        browser.DefaultRequestHeaders.Add("X-CSRF-TOKEN", response!["requestToken"]!.GetValue<string>());
    }

    private static JsonObject ProductBody() => new()
    {
        ["title"] = "Test print", ["description"] = "Printed part", ["price"] = 2500.25m,
        ["currency"] = "MMK", ["category"] = "Custom", ["material"] = "PLA",
        ["inStock"] = true, ["featured"] = false, ["imageUrls"] = new JsonArray(),
        ["images"] = new JsonArray(Upload(2, 2))
    };

    private static JsonObject Upload(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(SKColors.Red);
        using var image = SKImage.FromBitmap(bitmap);
        using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
        return new JsonObject
        {
            ["name"] = "photo.png", ["mimeType"] = "image/png", ["data"] = Convert.ToBase64String(encoded.ToArray())
        };
    }
}