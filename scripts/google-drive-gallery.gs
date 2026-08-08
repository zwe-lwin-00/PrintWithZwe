/**
 * Google Apps Script — lists images from your public Drive folder as JSON.
 *
 * Setup (one time):
 * 1. Open https://script.google.com → New project
 * 2. Paste this file, save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into public/site-config.json → gallery.feedUrl
 *    (or set VITE_GALLERY_FEED_URL in Netlify env)
 */

var FOLDER_ID = "1A65jclkdLnyAhN1J1kAXcArXsJe7FnBu";

function doGet() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var files = folder.getFiles();
  var items = [];

  while (files.hasNext()) {
    var file = files.next();
    var mime = file.getMimeType();

    if (mime.indexOf("image/") !== 0) {
      continue;
    }

    var fileId = file.getId();
    var name = file.getName();
    var title = name.replace(/\.[^.]+$/, "");

    items.push({
      id: fileId,
      title: title,
      imageUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=w1200-rw",
    });
  }

  items.sort(function (a, b) {
    return a.title.localeCompare(b.title);
  });

  return ContentService.createTextOutput(
    JSON.stringify({ items: items }),
  ).setMimeType(ContentService.MimeType.JSON);
}
