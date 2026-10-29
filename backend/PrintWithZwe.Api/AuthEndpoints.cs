using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;

namespace PrintWithZwe.Api;

public static class AuthEndpoints
{
    public static void MapAdminAuth(this WebApplication app)
    {
        app.MapGet("/api/auth/csrf", (HttpContext context, IAntiforgery antiforgery) =>
            Results.Ok(new { ok = true, requestToken = antiforgery.GetAndStoreTokens(context).RequestToken }));

        app.MapPost("/api/auth/login", async (LoginRequest input, UserManager<IdentityUser> users,
            SignInManager<IdentityUser> signIn, IConfiguration configuration) =>
        {
            IResult denied = Results.Json(new { ok = false, error = "Invalid credentials or authenticator code." }, statusCode: 401);
            if (!RequestValidation.IsValid(input)) return denied;
            var user = await users.FindByEmailAsync(input.Email.Trim());
            if (user is null || !await users.IsInRoleAsync(user, "Admin")) return denied;
            var result = await signIn.CheckPasswordSignInAsync(user, input.Password, lockoutOnFailure: true);
            if (!result.Succeeded) return denied;
            var requireMfa = configuration.GetValue("Security:RequireMfa", true);
            if (user.TwoFactorEnabled)
            {
                var code = input.Code?.Replace(" ", "").Replace("-", "") ?? "";
                if (!await users.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, code))
                {
                    await users.AccessFailedAsync(user);
                    return denied;
                }
            }
            else if (requireMfa) return denied;
            await users.ResetAccessFailedCountAsync(user);
            await signIn.SignInAsync(user, isPersistent: false);
            return Results.Ok(new { ok = true, email = user.Email });
        }).RequireRateLimiting("login");

        app.MapGet("/api/auth/session", async (ClaimsPrincipal principal, UserManager<IdentityUser> users,
            IConfiguration configuration) =>
        {
            var user = await users.GetUserAsync(principal);
            if (user is null || (configuration.GetValue("Security:RequireMfa", true) && !user.TwoFactorEnabled))
                return Results.Unauthorized();
            return Results.Ok(new { ok = true, email = user.Email });
        }).RequireAuthorization("Admin");

        app.MapPost("/api/auth/logout", async (ClaimsPrincipal principal, UserManager<IdentityUser> users,
            SignInManager<IdentityUser> signIn) =>
        {
            var user = await users.GetUserAsync(principal);
            if (user is not null) await users.UpdateSecurityStampAsync(user);
            await signIn.SignOutAsync();
            return Results.Ok(new { ok = true });
        }).RequireAuthorization("Admin");
    }
}