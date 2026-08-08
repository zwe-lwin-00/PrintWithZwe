const IMAGE_MIME = "mimeType contains 'image/'";

function buildImageItem(file) {
  const title = file.name.replace(/\.[^.]+$/, "");
  return {
    id: file.id,
    title,
    imageUrl: `https://lh3.googleusercontent.com/d/${file.id}=w1200-rw`,
  };
}

export async function handler(event) {
  const folderId =
    event.queryStringParameters?.folderId ||
    process.env.GALLERY_DRIVE_FOLDER_ID;

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing folderId" }),
    };
  }

  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Google Drive API key not configured",
        hint: "Set GOOGLE_DRIVE_API_KEY on Netlify, or use gallery.feedUrl with Apps Script",
      }),
    };
  }

  const query = encodeURIComponent(
    `'${folderId}' in parents and trashed=false and ${IMAGE_MIME}`,
  );
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${query}` +
    `&fields=files(id,name,mimeType)&orderBy=createdTime desc` +
    `&pageSize=100&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data.error?.message || "Drive API request failed",
        }),
      };
    }

    const items = (data.files || []).map(buildImageItem);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify({ items }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
    };
  }
}
