import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/api/catalogClient.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { fileToImageUpload } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

async function withCanvas(encode, check, options = {}) {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalBitmap = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap");
  const state = { closed: false, fills: 0, calls: [], dimensions: [] };
  const context = {
    fillRect() { state.fills += 1; },
    drawImage() { state.dimensions.push([canvas.width, canvas.height]); },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext() { return options.noContext ? null : context; },
    toBlob(callback, mimeType, quality) {
      state.calls.push({ mimeType, quality, width: canvas.width });
      callback(encode(mimeType, canvas.width, quality));
    },
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => canvas },
  });
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({
      width: 4032,
      height: 3024,
      close() { state.closed = true; },
    }),
  });
  try {
    await check(state, canvas);
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else delete globalThis.document;
    if (originalBitmap) Object.defineProperty(globalThis, "createImageBitmap", originalBitmap);
    else delete globalThis.createImageBitmap;
  }
}

const photo = () => new File([new Uint8Array(8 * 1024 * 1024)], "IMG_1234.JPG", { type: "image/jpeg" });
const smallBlob = (type) => new Blob([new Uint8Array(1024)], { type });
const oversizedBlob = (type) => new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type });

test("accepts a large original photo and encodes a correctly sized WebP", async () => {
  await withCanvas(smallBlob, async (state, canvas) => {
    const upload = await fileToImageUpload(photo());
    assert.equal(upload.mimeType, "image/webp");
    assert.equal(upload.name, "IMG_1234.webp");
    assert.equal(Buffer.from(upload.data, "base64").length, 1024);
    assert.deepEqual(state.dimensions[0], [2048, 1536]);
    assert.equal(state.closed, true);
    assert.equal(canvas.width, 1);
  });
});

test("falls back to JPEG when the browser silently produces PNG for WebP", async () => {
  await withCanvas((type) => type === "image/webp" ? oversizedBlob("image/png") : smallBlob(type), async (state) => {
    const upload = await fileToImageUpload(photo());
    assert.equal(upload.mimeType, "image/jpeg");
    assert.equal(upload.name, "IMG_1234.jpg");
    assert.equal(state.calls.length, 2);
    assert.ok(state.fills > 0);
    assert.equal(state.closed, true);
  });
});

test("reduces dimensions when lowering WebP quality cannot reach the limit", async () => {
  await withCanvas((type, width) => width > 1280 ? oversizedBlob(type) : smallBlob(type), async (state) => {
    const upload = await fileToImageUpload(photo());
    assert.equal(upload.mimeType, "image/webp");
    assert.ok(state.calls.some((call) => call.width === 1280));
    assert.equal(state.calls.at(-1).width, 1280);
    assert.equal(state.closed, true);
  });
});

test("reduces JPEG dimensions after WebP fallback if necessary", async () => {
  await withCanvas((type, width) => {
    if (type === "image/webp") return smallBlob("image/png");
    return width > 1600 ? oversizedBlob(type) : smallBlob(type);
  }, async (state) => {
    const upload = await fileToImageUpload(photo());
    assert.equal(upload.mimeType, "image/jpeg");
    assert.equal(state.calls.at(-1).width, 1600);
  });
});

test("never labels a PNG fallback as JPEG or WebP", async () => {
  await withCanvas(() => smallBlob("image/png"), async (state) => {
    await assert.rejects(fileToImageUpload(photo()), /could not compress/);
    assert.equal(state.closed, true);
  });
});

test("cleans up when encoding fails", async () => {
  await withCanvas(() => null, async (state, canvas) => {
    await assert.rejects(fileToImageUpload(photo()), /could not compress/);
    assert.equal(state.closed, true);
    assert.equal(canvas.width, 1);
  });
});

test("closes the decoded photo when no canvas context is available", async () => {
  await withCanvas(smallBlob, async (state) => {
    await assert.rejects(fileToImageUpload(photo()), /cannot process/);
    assert.equal(state.closed, true);
  }, { noContext: true });
});