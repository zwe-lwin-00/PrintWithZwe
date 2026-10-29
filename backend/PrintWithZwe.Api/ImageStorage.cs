using SkiaSharp;

namespace PrintWithZwe.Api;

public sealed class ImageStorage(StoragePaths paths)
{
    private const int MaxBytes = 2 * 1024 * 1024;
    private readonly SemaphoreSlim uploadGate = new(1, 1);

    public async Task<List<string>> SaveAsync(ImageUpload[] uploads, CancellationToken cancellation)
    {
        if (uploads.Length > 6) throw new CatalogException("At most 6 photos are allowed.");
        if (!await uploadGate.WaitAsync(0, cancellation))
            throw new CatalogException("An image upload is in progress. Please retry shortly.");

        var saved = new List<string>();
        try
        {
            var totalBytes = 0;
            foreach (var upload in uploads)
            {
                if (upload is null || string.IsNullOrEmpty(upload.Data) || upload.Data.Length > 2_796_204)
                    throw new CatalogException("Each photo must be JPEG, PNG or WebP, up to 2 MB.");

                byte[] bytes;
                try { bytes = Convert.FromBase64String(upload.Data); }
                catch (FormatException) { throw new CatalogException("Invalid image data."); }
                totalBytes += bytes.Length;
                if (bytes.Length > MaxBytes || totalBytes > 8 * 1024 * 1024)
                    throw new CatalogException("Photos exceed the upload limit (2 MB each, 8 MB total).");

                using var stream = new SKMemoryStream(bytes);
                using var codec = SKCodec.Create(stream);
                if (codec is null || codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp))
                    throw new CatalogException("Only JPEG, PNG and WebP photos are accepted.");
                var info = codec.Info;
                if (info.Width < 1 || info.Height < 1 || info.Width > 2048 || info.Height > 2048 || codec.FrameCount > 1)
                    throw new CatalogException("Use a non-animated photo no larger than 2048 x 2048.");
                using var bitmap = SKBitmap.Decode(codec);
                if (bitmap is null) throw new CatalogException("The photo is corrupt or invalid.");
                using var image = SKImage.FromBitmap(bitmap);
                using var encoded = image.Encode(SKEncodedImageFormat.Webp, 85);
                if (encoded is null) throw new CatalogException("Could not process the photo.");
                var url = "/uploads/" + Guid.NewGuid().ToString("N") + ".webp";
                saved.Add(url);
                var filePath = Path.Combine(paths.Uploads, Path.GetFileName(url));
                await File.WriteAllBytesAsync(filePath, encoded.ToArray(), cancellation);
                if (!OperatingSystem.IsWindows())
                    File.SetUnixFileMode(filePath, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.GroupRead);
            }
            return saved;
        }
        catch
        {
            Delete(saved);
            throw;
        }
        finally { uploadGate.Release(); }
    }

    public void Delete(IEnumerable<string> urls)
    {
        foreach (var url in urls)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(url, "^/uploads/[a-f0-9]{32}\\.webp$"))
                File.Delete(Path.Combine(paths.Uploads, Path.GetFileName(url)));
        }
    }
}