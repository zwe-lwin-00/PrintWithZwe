using Microsoft.AspNetCore.Identity;

namespace PrintWithZwe.Api;

public static class AdminProvisioning
{
    public static async Task CreateAsync(IServiceProvider services, string email)
    {
        var users = services.GetRequiredService<UserManager<IdentityUser>>();
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        if (await users.FindByEmailAsync(email) is not null)
            throw new InvalidOperationException("This administrator already exists. No changes were made.");
        Console.Write("New admin password (at least 14 characters): ");
        var password = ReadSecret();
        Console.Write("Confirm password: ");
        if (password != ReadSecret()) throw new InvalidOperationException("Passwords do not match.");
        var user = new IdentityUser { UserName = email, Email = email };
        var created = await users.CreateAsync(user, password);
        Check(created);
        try
        {
            Check(await users.ResetAuthenticatorKeyAsync(user));
            var key = await users.GetAuthenticatorKeyAsync(user);
            Console.WriteLine("Add this setup key to your authenticator app. Keep it private:");
            Console.WriteLine(key);
            Console.Write("Enter the current 6-digit authenticator code: ");
            var code = ReadSecret().Replace(" ", "");
            if (!await users.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, code))
                throw new InvalidOperationException("Authenticator verification failed. Account creation cancelled.");
            Check(await users.SetTwoFactorEnabledAsync(user, true));
            if (!await roles.RoleExistsAsync("Admin")) Check(await roles.CreateAsync(new IdentityRole("Admin")));
            Check(await users.AddToRoleAsync(user, "Admin"));
            Console.WriteLine("Administrator created with MFA. Store the authenticator setup key securely for recovery.");
        }
        catch
        {
            await users.DeleteAsync(user);
            throw;
        }
    }

    public static async Task ResetMfaAsync(IServiceProvider services, string email)
    {
        if (Console.IsInputRedirected)
            throw new InvalidOperationException("Use an interactive terminal for authenticator reset.");
        var users = services.GetRequiredService<UserManager<IdentityUser>>();
        var user = await users.FindByEmailAsync(email)
            ?? throw new InvalidOperationException("Administrator not found.");
        var key = await BeginMfaResetAsync(users, user);
        Console.WriteLine("The old authenticator key has been replaced. This account is locked until verification.");
        Console.WriteLine("Add this NEW setup key to your authenticator app. Do not share it:");
        Console.WriteLine(key);
        Console.Write("Enter the current 6-digit code from the NEW authenticator entry: ");
        await ConfirmMfaResetAsync(users, user, ReadSecret().Replace(" ", ""));
        Console.WriteLine("Authenticator reset complete. Your password and products are unchanged.");
    }

    public static async Task<string> BeginMfaResetAsync(UserManager<IdentityUser> users, IdentityUser user)
    {
        if (!await users.IsInRoleAsync(user, "Admin"))
            throw new InvalidOperationException("Only administrator accounts can use this reset command.");
        Check(await users.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue));
        Check(await users.UpdateSecurityStampAsync(user));
        Check(await users.SetTwoFactorEnabledAsync(user, false));
        Check(await users.ResetAuthenticatorKeyAsync(user));
        return await users.GetAuthenticatorKeyAsync(user)
            ?? throw new InvalidOperationException("Could not generate an authenticator key.");
    }

    public static async Task ConfirmMfaResetAsync(UserManager<IdentityUser> users, IdentityUser user, string code)
    {
        if (!await users.IsInRoleAsync(user, "Admin") ||
            !await users.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, code))
            throw new InvalidOperationException("Verification failed. The account remains locked. Rerun --reset-admin-mfa to try again.");
        Check(await users.SetTwoFactorEnabledAsync(user, true));
        Check(await users.ResetAccessFailedCountAsync(user));
        Check(await users.SetLockoutEndDateAsync(user, null));
    }

    private static void Check(IdentityResult result)
    {
        if (!result.Succeeded) throw new InvalidOperationException(string.Join(" ", result.Errors.Select(error => error.Description)));
    }

    private static string ReadSecret()
    {
        if (Console.IsInputRedirected) throw new InvalidOperationException("Use an interactive terminal for administrator setup.");
        var value = new System.Text.StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter) { Console.WriteLine(); return value.ToString(); }
            if (key.Key == ConsoleKey.Backspace) { if (value.Length > 0) value.Length--; }
            else if (!char.IsControl(key.KeyChar)) value.Append(key.KeyChar);
        }
    }
}