using System.ComponentModel.DataAnnotations;

namespace PrintWithZwe.Api;

public sealed record LoginRequest(
    [property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(256)] string Password,
    [property: StringLength(12)] string? Code = null);

public sealed class ProductRequest
{
    [Required, StringLength(160)] public string Title { get; init; } = "";
    [Required(AllowEmptyStrings = true), StringLength(5000)] public string Description { get; init; } = "";
    [Range(typeof(decimal), "0", "1000000000")] public decimal Price { get; init; }
    [Required, RegularExpression("^[A-Z]{3}$")] public string Currency { get; init; } = "MMK";
    [Required, StringLength(60)] public string Material { get; init; } = "PLA";
    [Required, StringLength(60)] public string Category { get; init; } = "Custom";
    public bool InStock { get; init; } = true;
    public bool Featured { get; init; }
    [Required, MaxLength(5)] public string[] ImageUrls { get; init; } = [];
    [Required, MaxLength(5)] public ImageUpload[] Images { get; init; } = [];
}

public sealed record ImageUpload(string Name, string MimeType, string Data);

public static class RequestValidation
{
    public static bool IsValid(object value) => Validator.TryValidateObject(
        value, new ValidationContext(value), [], validateAllProperties: true);
}

public sealed class CatalogException(string message) : Exception(message);

public sealed record StoragePaths(string Root)
{
    public string Uploads => Path.Combine(Root, "uploads");
    public string Keys => Path.Combine(Root, "keys");
    public string Database => Path.Combine(Root, "catalog.db");
}