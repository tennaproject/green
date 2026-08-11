import { paintSign, renderSign } from "./sign-renderer.js";

const DEFAULT_TEXT = 'Write something green...';
const ART_PIXEL_SIZE = 3;
const DEFAULT_FONT = "green-sans";
const BUNDLED_FONTS = ["green-sans", "departure-mono", "pixel-operator"];

// Linux users may not have all of these fonts, so there must be fallback
const SYSTEM_FONTS = [
  { family: "Comic Sans MS", fallback: "cursive" },
  { family: "Papyrus", fallback: "fantasy" },
  { family: "Wingdings", fallback: "fantasy" },
  { family: "Impact", fallback: "sans-serif" },
  { family: "Brush Script MT", fallback: "cursive" },
  { family: "Courier New", fallback: "monospace" },
  { family: "Georgia", fallback: "serif" },
  { family: "Times New Roman", fallback: "serif" },
  { family: "Trebuchet MS", fallback: "sans-serif" },
  { family: "Verdana", fallback: "sans-serif" },
];

// Green Sans space glyph is very narrow, so adding another space is needed
function formatSignText(text) {
  return signFont === "green-sans" ? text.replaceAll(" ", "  ") : text;
}

const elements = {
  text: document.querySelector("#sign-text"),
  count: document.querySelector("#character-count"),
  previewStage: document.querySelector(".preview-stage"),
  previewFit: document.querySelector("#preview-fit"),
  scene: document.querySelector("#sprite-scene"),
  sign: document.querySelector("#sign"),
  signCanvas: document.querySelector("#sign-canvas"),
  signCopy: document.querySelector("#sign-copy"),
  character: document.querySelector("#character-sprite"),
  pixelExport: document.querySelector("#pixel-export"),
  sideLeftButton: document.querySelector("#side-left-button"),
  sideRightButton: document.querySelector("#side-right-button"),
  moodHappyButton: document.querySelector("#mood-happy-button"),
  moodSadButton: document.querySelector("#mood-sad-button"),
  fontSelect: document.querySelector("#sign-font"),
  systemFontGroup: document.querySelector("#system-font-group"),
  resetButton: document.querySelector("#reset-button"),
  copyButton: document.querySelector("#copy-button"),
  downloadButton: document.querySelector("#download-button"),
};

let signRenderFrame;
let characterSide = "right";
let characterMood = "happy";
let signFont = DEFAULT_FONT;
let previewScale = 1;

function updateSign() {
  const text = elements.text.value;
  elements.signCopy.textContent = formatSignText(text);
  elements.count.textContent = `${text.length} ${text.length === 1 ? "character" : "characters"}`;
  scheduleSignRender();
}

function renderPreview() {
  signRenderFrame = undefined;
  positionCharacterAtFist();
  renderSign(
    elements.signCanvas,
    elements.sign.offsetWidth,
    elements.sign.offsetHeight,
  );
  fitPreview();
}

function positionCharacterAtFist() {
  const signHeight = elements.sign.offsetHeight;
  const sceneStyle = getComputedStyle(elements.scene);
  const fistOffset = Number.parseFloat(sceneStyle.getPropertyValue("--character-fist-offset")) || 0;
  const signTopSpace = Math.max(0, fistOffset - signHeight);
  const characterTop = Math.max(0, signHeight - fistOffset);

  elements.scene.style.setProperty("--sign-top-space", `${signTopSpace}px`);
  elements.scene.style.setProperty("--character-top", `${characterTop}px`);
}

function fitPreview() {
  const stageStyle = getComputedStyle(elements.previewStage);
  const availableWidth = Math.max(
    0,
    elements.previewStage.clientWidth
      - (Number.parseFloat(stageStyle.paddingInlineStart) || 0)
      - (Number.parseFloat(stageStyle.paddingInlineEnd) || 0),
  );
  const availableHeight = Math.max(
    0,
    elements.previewStage.clientHeight
      - (Number.parseFloat(stageStyle.paddingBlockStart) || 0)
      - (Number.parseFloat(stageStyle.paddingBlockEnd) || 0),
  );
  const logicalWidth = elements.scene.offsetWidth;
  const logicalHeight = elements.scene.offsetHeight;
  const maximumScale = Number.parseFloat(
    stageStyle.getPropertyValue("--preview-max-scale"),
  ) || 1;

  previewScale = Math.min(
    maximumScale,
    logicalWidth > 0 ? availableWidth / logicalWidth : 1,
    logicalHeight > 0 ? availableHeight / logicalHeight : 1,
  );
  previewScale = Math.max(0, Number.isFinite(previewScale) ? previewScale : 1);

  elements.scene.style.setProperty("--preview-scale", previewScale);
  elements.previewFit.style.inlineSize = `${Math.ceil(logicalWidth * previewScale)}px`;
  elements.previewFit.style.blockSize = `${Math.ceil(logicalHeight * previewScale)}px`;
}

function scheduleSignRender() {
  if (signRenderFrame !== undefined) return;
  signRenderFrame = requestAnimationFrame(renderPreview);
}

function setCharacterSide(side) {
  characterSide = side === "left" ? "left" : "right";

  elements.scene.dataset.characterSide = characterSide;
  const left = characterSide === "left";
  elements.sideLeftButton.setAttribute("aria-pressed", String(left));
  elements.sideRightButton.setAttribute("aria-pressed", String(!left));
  scheduleSignRender();
}

function setCharacterMood(mood) {
  characterMood = mood === "sad" ? "sad" : "happy";
  elements.character.src = characterMood === "sad"
    ? "assets/green-sad.svg"
    : "assets/green.svg";
  const sad = characterMood === "sad";
  elements.moodHappyButton.setAttribute("aria-pressed", String(!sad));
  elements.moodSadButton.setAttribute("aria-pressed", String(sad));
}

// font detection brain rot
function fontIsInstalled(family) {
  const context = document.createElement("canvas").getContext("2d");
  const sample = "WimM@1l";

  return ["monospace", "serif"].some((generic) => {
    context.font = `72px "${family}", ${generic}`;
    const withFamily = context.measureText(sample).width;
    context.font = `72px ${generic}`;
    return withFamily !== context.measureText(sample).width;
  });
}

function buildSystemFontOptions() {
  elements.systemFontGroup.replaceChildren(
    ...SYSTEM_FONTS.map(({ family, fallback }) => {
      const option = document.createElement("option");
      const installed = fontIsInstalled(family);
      option.value = `system:${family}`;
      option.textContent = installed ? family : `${family} (not installed)`;
      option.disabled = !installed;
      option.dataset.stack = `"${family}", ${fallback}`;
      return option;
    }),
  );
}

function setSignFont(font) {
  const system = typeof font === "string" && font.startsWith("system:");
  signFont = system || BUNDLED_FONTS.includes(font) ? font : DEFAULT_FONT;
  elements.fontSelect.value = signFont;

  if (system) {
    const option = elements.fontSelect.selectedOptions[0];
    elements.signCopy.dataset.font = "system";
    elements.signCopy.style.setProperty("--font-sign", option.dataset.stack);
  } else {
    elements.signCopy.dataset.font = signFont;
    elements.signCopy.style.removeProperty("--font-sign");
  }

  updateSign();
}

function resetSign() {
  elements.text.value = DEFAULT_TEXT;
  setCharacterSide("right");
  setCharacterMood("happy");
  setSignFont(DEFAULT_FONT);
  elements.text.focus();
}


// prevent firefox (and maybe other browsers) from scaling the svg's pixels separately
function rasterizeCharacter() {
  const canvas = document.createElement("canvas");
  canvas.width = elements.character.naturalWidth;
  canvas.height = elements.character.naturalHeight;

  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.drawImage(elements.character, 0, 0);
  return canvas;
}

async function createExportCanvas(scale = 2) {
  await document.fonts.ready;
  updateSign();
  await elements.character.decode().catch(() => {});
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const exportPadding = 8;
  const sceneRect = elements.scene.getBoundingClientRect();
  const inversePreviewScale = 1 / Math.max(previewScale, 0.001);

  // physical to logical size conversion
  const toLogicalRect = (rect) => {
    const left = (rect.left - sceneRect.left) * inversePreviewScale;
    const top = (rect.top - sceneRect.top) * inversePreviewScale;
    const width = rect.width * inversePreviewScale;
    const height = rect.height * inversePreviewScale;
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    };
  };

  const signRect = toLogicalRect(elements.sign.getBoundingClientRect());
  const copyRect = toLogicalRect(elements.signCopy.getBoundingClientRect());
  const characterRect = toLogicalRect(elements.character.getBoundingClientRect());
  const copyStyle = getComputedStyle(elements.signCopy);
  const contentLeft = Math.min(signRect.left, characterRect.left);
  const contentTop = Math.min(signRect.top, characterRect.top);
  const contentRight = Math.max(signRect.right, characterRect.right);
  const contentBottom = Math.max(signRect.bottom, characterRect.bottom);
  const snap = (value) => Math.round(value * scale) / scale;
  const signX = snap(signRect.left - contentLeft + exportPadding);
  const signY = snap(signRect.top - contentTop + exportPadding);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((contentRight - contentLeft + exportPadding * 2) * scale);
  canvas.height = Math.ceil((contentBottom - contentTop + exportPadding * 2) * scale);

  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  if (scale < 1) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    paintSign(
      context,
      Math.round(signX * scale),
      Math.round(signY * scale),
      Math.round(signRect.width * scale),
      Math.round(signRect.height * scale),
      1,
    );
    context.restore();
  } else {
    paintSign(context, signX, signY, signRect.width, signRect.height);
  }

  const value = formatSignText(elements.text.value);
  if (value) {
    const fontSize = Number.parseFloat(copyStyle.fontSize) || 32;
    const lineHeight = Number.parseFloat(copyStyle.lineHeight) || fontSize * 1.36;
    const copyX = snap(copyRect.left - contentLeft + exportPadding);
    const copyY = snap(copyRect.top - contentTop + exportPadding);
    context.fillStyle = copyStyle.color;
    context.font = `${copyStyle.fontWeight} ${fontSize}px ${copyStyle.fontFamily}`;
    context.textBaseline = "top";
    value.split("\n").forEach((line, index) => {
      context.fillText(line, copyX, copyY + index * lineHeight);
    });
  }

  if (elements.character.complete && elements.character.naturalWidth) {
    let characterX = snap(characterRect.left - contentLeft + exportPadding);
    const characterY = snap(characterRect.top - contentTop + exportPadding);
    let characterWidth = snap(characterRect.width);
    let characterHeight = snap(characterRect.height);
    const characterBitmap = rasterizeCharacter();

    if (scale < 1) {
      const originalWidth = characterWidth;
      characterWidth = characterBitmap.width / scale;
      characterHeight = characterBitmap.height / scale;
      if (characterSide === "left") {
        characterX += originalWidth - characterWidth;
      }
    }

    context.imageSmoothingEnabled = false;
    context.save();
    if (characterSide === "right") {
      context.translate(characterX + characterWidth, 0);
      context.scale(-1, 1);
      context.drawImage(characterBitmap, 0, characterY, characterWidth, characterHeight);
    } else {
      context.drawImage(
        characterBitmap,
        characterX,
        characterY,
        characterWidth,
        characterHeight,
      );
    }
    context.restore();
  }

  return canvas;
}

async function clipboardPng() {
  const nativePixels = elements.pixelExport.checked;
  const canvas = await createExportCanvas(nativePixels ? 1 / ART_PIXEL_SIZE : 2);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG creation failed");
  return blob;
}

async function copySign() {
  const label = elements.copyButton.querySelector("span");
  const originalLabel = label.textContent;
  elements.copyButton.disabled = true;
  label.textContent = "Copying…";

  try {
    const item = new ClipboardItem({ "image/png": clipboardPng() });
    await navigator.clipboard.write([item]);
    label.textContent = "Copied";
  } catch (error) {
    console.error(error);
    label.textContent = "Copy failed";
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  elements.copyButton.disabled = false;
  label.textContent = originalLabel;
}

async function downloadSign() {
  const originalLabel = elements.downloadButton.querySelector("span").textContent;
  elements.downloadButton.disabled = true;
  elements.downloadButton.querySelector("span").textContent = "Preparing…";

  try {
    const nativePixels = elements.pixelExport.checked;
    const scale = nativePixels ? 1 / ART_PIXEL_SIZE : 2;
    const canvas = await createExportCanvas(scale);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("PNG creation failed");

    const timestamp = new Date().toISOString();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sizeSuffix = nativePixels ? "-native" : "";
    link.download = `green-sign${sizeSuffix}-${timestamp}.png`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  } finally {
    elements.downloadButton.disabled = false;
    elements.downloadButton.querySelector("span").textContent = originalLabel;
  }
}

elements.text.addEventListener("input", updateSign);
elements.sideLeftButton.addEventListener("click", () => setCharacterSide("left"));
elements.sideRightButton.addEventListener("click", () => setCharacterSide("right"));
elements.moodHappyButton.addEventListener("click", () => setCharacterMood("happy"));
elements.moodSadButton.addEventListener("click", () => setCharacterMood("sad"));
elements.fontSelect.addEventListener("change", () =>
  setSignFont(elements.fontSelect.value),
);
elements.resetButton.addEventListener("click", resetSign);
elements.copyButton.addEventListener("click", copySign);
elements.downloadButton.addEventListener("click", downloadSign);

const previewResizeObserver = new ResizeObserver(scheduleSignRender);
previewResizeObserver.observe(elements.previewStage);

document.fonts.ready.then(updateSign);
setCharacterSide("right");
setCharacterMood("happy");
buildSystemFontOptions();
setSignFont(DEFAULT_FONT);
