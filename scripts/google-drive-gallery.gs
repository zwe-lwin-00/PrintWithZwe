/**
 * Google Apps Script — lists images from your public Drive folder as JSON.
 *
 * Lists images in:
 *   1. The root folder (FOLDER_ID)
 *   2. A "gallery" subfolder if it exists
 *
 * Skips: products/, _trash/, spreadsheets, and other non-image files.
 *
 * Setup:
 * 1. Open https://script.google.com → New project (or update existing gallery project)
 * 2. Paste this file, save
 * 3. Deploy → New deployment → Web app (Execute as: Me, Anyone)
 * 4. Copy Web App URL → public/site-config.json → gallery.feedUrl
 */

var FOLDER_ID = "1A65jclkdLnyAhN1J1kAXcArXsJe7FnBu";
var SKIP_FOLDERS = { products: true, _trash: true, gallery: false };

function doGet() {
  var items = [];
  var seen = {};

  collectImagesFromFolder(DriveApp.getFolderById(FOLDER_ID), items, seen, false);

  var galleryFolders = DriveApp.getFolderById(FOLDER_ID).getFoldersByName("gallery");
  if (galleryFolders.hasNext()) {
    collectImagesFromFolder(galleryFolders.next(), items, seen, true);
  }

  items.sort(function (a, b) {
    return a.title.localeCompare(b.title);
  });

  return ContentService.createTextOutput(JSON.stringify({ items: items })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function collectImagesFromFolder(folder, items, seen, isGallerySubfolder) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    addImageFile(files.next(), items, seen);
  }

  if (isGallerySubfolder) return;

  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var sub = subfolders.next();
    var name = sub.getName();
    if (SKIP_FOLDERS[name]) continue;
    if (name === "gallery") continue;
    collectImagesFromFolder(sub, items, seen, true);
  }
}

function addImageFile(file, items, seen) {
  if (file.getMimeType().indexOf("image/") !== 0) return;

  var fileId = file.getId();
  if (seen[fileId]) return;
  seen[fileId] = true;

  var title = file.getName().replace(/\.[^.]+$/, "");
  items.push({
    id: fileId,
    title: title,
    imageUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=w1200-rw",
  });
}
