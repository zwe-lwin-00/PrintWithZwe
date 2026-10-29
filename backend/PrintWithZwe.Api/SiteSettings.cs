using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace PrintWithZwe.Api;

public sealed class SiteSettings
{
    public int Id { get; set; } = 1;
    [MaxLength(80)] public string BrandName { get; set; } = "Print with Zwe";
    [MaxLength(180)] public string BrandTagline { get; set; } = "Bringing your ideas to life, layer by layer.";
    [MaxLength(140)] public string HeroBadge { get; set; } = "Bambu Lab quality · Precision engineering";
    [MaxLength(80)] public string HeroBadgeShort { get; set; } = "Bambu Lab quality prints";
    [MaxLength(30)] public string PhoneNumber { get; set; } = "+959787238201";
    [MaxLength(40)] public string TelegramUsername { get; set; } = "zwe_ll";
    [MaxLength(30)] public string WhatsappNumber { get; set; } = "959787238201";
    [MaxLength(80)] public string MessengerPageId { get; set; } = "printwithzwe";
    [MaxLength(2048)] public string LocationUrl { get; set; } = "https://maps.app.goo.gl/Fq5xDbNXvTAWbB8t5";

    public SiteConfigResponse ToResponse() => new(
        new BrandResponse(BrandName, BrandTagline, HeroBadge, HeroBadgeShort),
        new ContactResponse(PhoneNumber, TelegramUsername, WhatsappNumber, MessengerPageId, LocationUrl));

    public static SiteSettings CreateDefault() => new();
}

public sealed record BrandResponse(string Name, string Tagline, string HeroBadge, string HeroBadgeShort);
public sealed record ContactResponse(string PhoneNumber, string TelegramUsername, string WhatsappNumber, string MessengerPageId, string LocationUrl);
public sealed record SiteConfigResponse(BrandResponse Brand, ContactResponse Contact);

public sealed class SiteSettingsRequest
{
    [Required, StringLength(80)] public string BrandName { get; init; } = "";
    [Required, StringLength(180)] public string BrandTagline { get; init; } = "";
    [Required, StringLength(140)] public string HeroBadge { get; init; } = "";
    [Required, StringLength(80)] public string HeroBadgeShort { get; init; } = "";
    [Required, StringLength(30)] public string PhoneNumber { get; init; } = "";
    [Required, StringLength(40)] public string TelegramUsername { get; init; } = "";
    [StringLength(30)] public string WhatsappNumber { get; init; } = "";
    [StringLength(80)] public string MessengerPageId { get; init; } = "";
    [StringLength(2048), Url] public string LocationUrl { get; init; } = "";
}

public static class SiteSettingsEndpoints
{
    public static void MapSiteSettings(this WebApplication app)
    {
        app.MapGet("/api/site-config", Read);
        app.MapGet("/api/admin/site-config", Read).RequireAuthorization("Admin");
        app.MapPut("/api/admin/site-config", async (SiteSettingsRequest input, CatalogDb database, CancellationToken cancellation) =>
        {
            if (!RequestValidation.IsValid(input) || !IsAllowedMapUrl(input.LocationUrl))
                return Results.BadRequest(new { ok = false, error = "Check the text lengths and required fields." });
            var settings = await database.SiteSettings.SingleOrDefaultAsync(item => item.Id == 1, cancellation);
            var isNew = settings is null;
            settings ??= SiteSettings.CreateDefault();
            settings.BrandName = input.BrandName.Trim();
            settings.BrandTagline = input.BrandTagline.Trim();
            settings.HeroBadge = input.HeroBadge.Trim();
            settings.HeroBadgeShort = input.HeroBadgeShort.Trim();
            settings.PhoneNumber = input.PhoneNumber.Trim();
            settings.TelegramUsername = input.TelegramUsername.Trim().TrimStart('@');
            settings.WhatsappNumber = input.WhatsappNumber.Trim();
            settings.MessengerPageId = input.MessengerPageId.Trim();
            settings.LocationUrl = input.LocationUrl.Trim();
            if (isNew) database.SiteSettings.Add(settings);
            await database.SaveChangesAsync(cancellation);
            return Results.Ok(new { ok = true, config = settings.ToResponse() });
        }).RequireAuthorization("Admin").RequireRateLimiting("writes");
    }

    private static bool IsAllowedMapUrl(string value)
    {
        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)) return false;
        return uri.Scheme == Uri.UriSchemeHttps &&
            (uri.Host.Equals("maps.app.goo.gl", StringComparison.OrdinalIgnoreCase) ||
             uri.Host.Equals("www.google.com", StringComparison.OrdinalIgnoreCase) ||
             uri.Host.Equals("maps.google.com", StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<IResult> Read(CatalogDb database, CancellationToken cancellation)
    {
        var settings = await database.SiteSettings.AsNoTracking().SingleOrDefaultAsync(item => item.Id == 1, cancellation)
            ?? SiteSettings.CreateDefault();
        return Results.Ok(new { ok = true, config = settings.ToResponse() });
    }
}