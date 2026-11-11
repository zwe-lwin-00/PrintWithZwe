using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace PrintWithZwe.Api;

public sealed class PricingSettings
{
    public int Id { get; set; } = 1;
    public decimal BaseFee { get; set; } = 3000;
    public decimal MachineRatePerHour { get; set; } = 1000;
    /// <summary>Extra MMK/g for 2-color AMS prints (1-color uses material rate only).</summary>
    public decimal ColorSurcharge2PerGram { get; set; } = 50;
    public decimal ColorSurcharge3PerGram { get; set; } = 90;
    public decimal ColorSurcharge4PerGram { get; set; } = 120;
    public List<MaterialRate> Materials { get; set; } = [];

    public static PricingSettings CreateDefault() => new()
    {
        Materials =
        [
            new() { Id = "pla", Label = "PLA", RatePerGram = 250 },
            new() { Id = "petg", Label = "PETG", RatePerGram = 270 },
            new() { Id = "abs", Label = "ABS", RatePerGram = 280 },
            new() { Id = "tpu", Label = "TPU", RatePerGram = 350 },
            // Kept for API compatibility; calculator uses material + color count instead.
            new() { Id = "multi-color", Label = "Multi-Color (AMS)", RatePerGram = 370 }
        ]
    };

    public object ToResponse() => new
    {
        Currency = "MMK",
        Locale = "en-MM",
        BaseFee,
        MachineRatePerHour,
        ColorSurchargesPerGram = new Dictionary<string, decimal>
        {
            ["1"] = 0,
            ["2"] = ColorSurcharge2PerGram,
            ["3"] = ColorSurcharge3PerGram,
            ["4"] = ColorSurcharge4PerGram,
        },
        Materials = MaterialIds.Select(id => Materials.Single(material => material.Id == id))
    };

    public static readonly string[] MaterialIds = ["pla", "petg", "abs", "tpu", "multi-color"];
    public static readonly string[] BaseMaterialIds = ["pla", "petg", "abs", "tpu"];
}

public sealed class MaterialRate
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public decimal RatePerGram { get; set; }
}

public sealed class PricingRequest
{
    [Range(typeof(decimal), "0", "1000000000")] public decimal BaseFee { get; init; }
    [Range(typeof(decimal), "0", "1000000000")] public decimal MachineRatePerHour { get; init; }
    [Range(typeof(decimal), "0", "1000000")] public decimal ColorSurcharge2PerGram { get; init; }
    [Range(typeof(decimal), "0", "1000000")] public decimal ColorSurcharge3PerGram { get; init; }
    [Range(typeof(decimal), "0", "1000000")] public decimal ColorSurcharge4PerGram { get; init; }
    [Required, MinLength(5), MaxLength(5)] public MaterialRateRequest[] Materials { get; init; } = [];

    public bool IsValid() => RequestValidation.IsValid(this)
        && Materials.All(material => material is not null && RequestValidation.IsValid(material))
        && Materials.Select(material => material.Id).ToHashSet().SetEquals(PricingSettings.MaterialIds);
}

public sealed record MaterialRateRequest(
    [property: Required] string Id,
    [property: Range(typeof(decimal), "0", "1000000")] decimal RatePerGram);

public static class PricingEndpoints
{
    public static void MapPricing(this WebApplication app)
    {
        app.MapGet("/api/pricing", Read);
        app.MapGet("/api/admin/pricing", Read).RequireAuthorization("Admin");
        app.MapPut("/api/admin/pricing", async (PricingRequest input, CatalogDb database, CancellationToken cancellation) =>
        {
            if (!input.IsValid())
                return Results.BadRequest(new { ok = false, error = "Use non-negative rates and include each of the five materials exactly once." });
            var settings = await database.PricingSettings.SingleOrDefaultAsync(item => item.Id == 1, cancellation);
            if (settings is null)
            {
                settings = PricingSettings.CreateDefault();
                database.PricingSettings.Add(settings);
            }
            settings.BaseFee = input.BaseFee;
            settings.MachineRatePerHour = input.MachineRatePerHour;
            settings.ColorSurcharge2PerGram = input.ColorSurcharge2PerGram;
            settings.ColorSurcharge3PerGram = input.ColorSurcharge3PerGram;
            settings.ColorSurcharge4PerGram = input.ColorSurcharge4PerGram;
            foreach (var material in settings.Materials)
                material.RatePerGram = input.Materials.Single(item => item.Id == material.Id).RatePerGram;

            // Keep legacy multi-color row aligned with PLA + 4-color surcharge.
            var pla = settings.Materials.Single(material => material.Id == "pla");
            var multi = settings.Materials.Single(material => material.Id == "multi-color");
            multi.RatePerGram = pla.RatePerGram + settings.ColorSurcharge4PerGram;

            await database.SaveChangesAsync(cancellation);
            return Results.Ok(new { ok = true, pricing = settings.ToResponse() });
        }).RequireAuthorization("Admin").RequireRateLimiting("writes");
    }

    private static async Task<IResult> Read(CatalogDb database, CancellationToken cancellation)
    {
        var settings = await database.PricingSettings.AsNoTracking().SingleOrDefaultAsync(item => item.Id == 1, cancellation)
            ?? PricingSettings.CreateDefault();
        return Results.Ok(new { ok = true, pricing = settings.ToResponse() });
    }
}
