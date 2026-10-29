using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace PrintWithZwe.Api;

public sealed class CatalogDb(DbContextOptions<CatalogDb> options)
    : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Product>().HasIndex(product => product.Archived);
        builder.Entity<Product>().HasMany(product => product.Images).WithOne().OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ProductImage>().HasIndex(image => image.Url).IsUnique();
    }
}

public sealed class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "MMK";
    public string Material { get; set; } = "PLA";
    public string Category { get; set; } = "Custom";
    public bool InStock { get; set; } = true;
    public bool Featured { get; set; }
    public bool Archived { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<ProductImage> Images { get; set; } = [];

    public object ToResponse() => new
    {
        Id, Title, Description, Price, Currency, Material, Category, InStock,
        Featured, Archived, CreatedAt, UpdatedAt,
        ImageUrls = Images.OrderBy(image => image.Position).Select(image => image.Url).ToArray(),
        ImageUrl = Images.OrderBy(image => image.Position).Select(image => image.Url).FirstOrDefault() ?? ""
    };
}

public sealed class ProductImage
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public int Position { get; set; }
}