using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace PrintWithZwe.Api;

public sealed class PricingSettings
{
    public int Id { get; set; } = 1;
    public decimal BaseFee { get; set; } = 2000;
    public decimal MachineRatePerHour { get; set; } = 1500;
    public List<MaterialRate> Materials { get; set; } = [];

    public static PricingSettings CreateDefault() => new()
    {
        Materials =
        [
            new() { Id = "pla", Label = "PLA", RatePerGram = 50 },
            new() { Id = "petg", Label = "PETG", RatePerGram = 65 },
            new() { Id = "abs", Label = "ABS", RatePerGram = 70 },
            new() { Id = "tpu", Label = "TPU", RatePerGram = 90 },
            new() { Id = "multi-color", Label = "Multi-Color (AMS)", RatePerGram = 80 }
        ]
    };

    public object ToResponse() => new
    {
        Currency = "MMK", Locale = "en-MM", BaseFee, MachineRatePerHour,
        Materials = MaterialIds.Select(id => Materials.Single(material => material.Id == id))
    };

    public static readonly string[] MaterialIds = ["pla", "petg", "abs", "tpu", "multi-color"];
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
            foreach (var material in settings.Materials)
                material.RatePerGram = input.Materials.Single(item => item.Id == material.Id).RatePerGram;
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