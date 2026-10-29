using Microsoft.EntityFrameworkCore;

namespace PrintWithZwe.Api;

public static class CatalogEndpoints
{
    public static void MapCatalog(this WebApplication app)
    {
        app.MapGet("/api/products", async (CatalogDb database, CancellationToken cancellation) =>
        {
            var products = await database.Products.AsNoTracking().Include(product => product.Images)
                .Where(product => !product.Archived).OrderByDescending(product => product.UpdatedAt)
                .ToListAsync(cancellation);
            return Results.Ok(new { ok = true, items = products.Select(product => product.ToResponse()) });
        });

        var admin = app.MapGroup("/api/admin/products").RequireAuthorization("Admin");
        admin.MapGet("/", async (CatalogDb database, CancellationToken cancellation) =>
        {
            var products = await database.Products.AsNoTracking().Include(product => product.Images)
                .OrderByDescending(product => product.UpdatedAt).ToListAsync(cancellation);
            return Results.Ok(new { ok = true, items = products.Select(product => product.ToResponse()) });
        });
        admin.MapPost("/", async (ProductRequest input, CatalogDb database, ImageStorage images,
            CancellationToken cancellation) => await SaveProduct(null, input, database, images, cancellation))
            .RequireRateLimiting("writes");
        admin.MapPut("/{id}", async (string id, ProductRequest input, CatalogDb database,
            ImageStorage images, CancellationToken cancellation) =>
            await SaveProduct(id, input, database, images, cancellation)).RequireRateLimiting("writes");
        admin.MapDelete("/{id}", async (string id, CatalogDb database, CancellationToken cancellation) =>
        {
            var product = await database.Products.FindAsync([id], cancellation);
            if (product is null) return Results.NotFound(new { ok = false, error = "Product not found." });
            product.Archived = true;
            product.UpdatedAt = DateTime.UtcNow;
            await database.SaveChangesAsync(cancellation);
            return Results.Ok(new { ok = true });
        }).RequireRateLimiting("writes");
        admin.MapPost("/{id}/restore", async (string id, CatalogDb database, CancellationToken cancellation) =>
        {
            var product = await database.Products.FindAsync([id], cancellation);
            if (product is null) return Results.NotFound(new { ok = false, error = "Product not found." });
            if (!product.Archived) return Results.Ok(new { ok = true });
            product.Archived = false;
            product.UpdatedAt = DateTime.UtcNow;
            await database.SaveChangesAsync(cancellation);
            return Results.Ok(new { ok = true });
        }).RequireRateLimiting("writes");
    }

    private static async Task<IResult> SaveProduct(string? id, ProductRequest input,
        CatalogDb database, ImageStorage images, CancellationToken cancellation)
    {
        if (!RequestValidation.IsValid(input) || input.ImageUrls.Length + input.Images.Length is < 1 or > 6)
            return Results.BadRequest(new { ok = false, error = "Check product fields and include 1 to 6 photos." });

        var product = id is null ? new Product() : await database.Products.Include(item => item.Images)
            .SingleOrDefaultAsync(item => item.Id == id, cancellation);
        if (product is null) return Results.NotFound(new { ok = false, error = "Product not found." });
        if (product.Archived) return Results.BadRequest(new { ok = false, error = "Archived products cannot be edited." });

        var retained = input.ImageUrls.Distinct().ToArray();
        if (retained.Any(url => !product.Images.Any(image => image.Url == url)))
            return Results.BadRequest(new { ok = false, error = "Upload photos instead of adding external image URLs." });

        var added = await images.SaveAsync(input.Images, cancellation);
        try
        {
            product.Title = input.Title.Trim();
            product.Description = input.Description.Trim();
            product.Price = input.Price;
            product.Currency = input.Currency;
            product.Category = input.Category.Trim();
            product.Material = input.Material.Trim();
            product.InStock = input.InStock;
            product.Featured = input.Featured;
            product.UpdatedAt = DateTime.UtcNow;
            var removed = product.Images.Where(image => !retained.Contains(image.Url)).ToArray();
            foreach (var image in removed) product.Images.Remove(image);
            foreach (var url in added) product.Images.Add(new ProductImage { Url = url });
            var order = retained.Concat(added).ToList();
            foreach (var image in product.Images) image.Position = order.IndexOf(image.Url);
            if (id is null) database.Products.Add(product);
            await database.SaveChangesAsync(cancellation);
            return Results.Ok(new { ok = true, item = product.ToResponse() });
        }
        catch
        {
            images.Delete(added);
            throw;
        }
    }
}