import { paintSign, renderSign } from "./sign-renderer.js";

const DEFAULT_TEXT = 'Write something green...';
const ART_PIXEL_SIZE = 3;

function formatGreenSansText(text) {
  return text.replaceAll(" ", "  ");
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
  resetButton: document.querySelector("#reset-button"),
  copyButton: document.querySelector("#copy-button"),
  downloadButton: document.querySelector("#download-button"),
};

let signRenderFrame;
let characterSide = "right";
let characterMood = "happy";
let previewScale = 1;

function updateSign() {
  const text = elements.text.value;
  elements.signCopy.textContent = formatGreenSansText(text);
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

function resetSign() {
  elements.text.value = DEFAULT_TEXT;
  setCharacterSide("right");
  setCharacterMood("happy");
  updateSign();
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

  const value = formatGreenSansText(elements.text.value);
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
elements.resetButton.addEventListener("click", resetSign);
elements.copyButton.addEventListener("click", copySign);
elements.downloadButton.addEventListener("click", downloadSign);

const previewResizeObserver = new ResizeObserver(scheduleSignRender);
previewResizeObserver.observe(elements.previewStage);

document.fonts.ready.then(updateSign);
setCharacterSide("right");
setCharacterMood("happy");
updateSign();
