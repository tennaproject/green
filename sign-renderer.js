const BORDER_UNIT = 3;

const COLORS = {
  paper: "rgb(245 209 182)",
  frame: "rgb(0 32 21)",
  stitch: "rgb(150 125 132)",
};

// yes, this really works
// # = frame
// + = stitch
// . = transparent
const EDGES = {
  top: ".######################+########################################+#############+.",
  right: ".###++############################++#####.#####+#######+########+#.",
  bottom: ".################+##################################+##########################.",
  left: ".##+++++####################+##########+.#######+++######.######+#.",
};

function forEachDetailRun(pattern, callback) {
  for (let start = 0; start < pattern.length;) {
    const symbol = pattern[start];
    let end = start + 1;
    while (end < pattern.length && pattern[end] === symbol) end += 1;
    if (symbol !== "#") callback(symbol, start, end - start);
    start = end;
  }
}

function runPosition(start, length, patternLength, span, unit) {
  const sourceCenter = start + (length - 1) / 2;
  const targetCenter = (sourceCenter / (patternLength - 1)) * (span - unit);
  return Math.round(targetCenter - ((length - 1) * unit) / 2);
}

function paintRun(context, symbol, x, y, width, height) {
  context.clearRect(x, y, width, height);
  if (symbol === "+") {
    context.fillStyle = COLORS.stitch;
    context.fillRect(x, y, width, height);
  }
}

function paintHorizontalDetails(context, pattern, x, y, width, unit) {
  forEachDetailRun(pattern, (symbol, start, length) => {
    const runX = x + runPosition(start, length, pattern.length, width, unit);
    paintRun(context, symbol, runX, y, length * unit, unit);
  });
}

function paintVerticalDetails(context, pattern, x, y, height, unit) {
  forEachDetailRun(pattern, (symbol, start, length) => {
    const runY = y + runPosition(start, length, pattern.length, height, unit);
    paintRun(context, symbol, x, runY, unit, length * unit);
  });
}

export function paintSign(context, x, y, width, height) {
  const safeWidth = Math.max(3, Math.round(width));
  const safeHeight = Math.max(3, Math.round(height));
  const unit = BORDER_UNIT;
  const right = x + safeWidth - unit;
  const bottom = y + safeHeight - unit;

  context.save();
  context.imageSmoothingEnabled = false;
  context.clearRect(x, y, safeWidth, safeHeight);

  context.fillStyle = COLORS.paper;
  context.fillRect(
    x + unit,
    y + unit,
    Math.max(1, safeWidth - unit * 2),
    Math.max(1, safeHeight - unit * 2),
  );

  context.fillStyle = COLORS.frame;
  context.fillRect(x, y, safeWidth, unit);
  context.fillRect(x, bottom, safeWidth, unit);
  context.fillRect(x, y, unit, safeHeight);
  context.fillRect(right, y, unit, safeHeight);

  paintHorizontalDetails(context, EDGES.top, x, y, safeWidth, unit);
  paintHorizontalDetails(context, EDGES.bottom, x, bottom, safeWidth, unit);
  paintVerticalDetails(context, EDGES.left, x, y, safeHeight, unit);
  paintVerticalDetails(context, EDGES.right, right, y, safeHeight, unit);

  context.clearRect(x, y, unit, unit);
  context.clearRect(right, y, unit, unit);
  context.clearRect(x, bottom, unit, unit);
  context.clearRect(right, bottom, unit, unit);
  context.restore();
}

export function renderSign(canvas, width, height, pixelRatio = window.devicePixelRatio || 1) {
  const cssWidth = Math.max(1, Math.round(width));
  const cssHeight = Math.max(1, Math.round(height));
  const ratio = Math.max(1, pixelRatio);
  const outputWidth = Math.round(cssWidth * ratio);
  const outputHeight = Math.round(cssHeight * ratio);

  if (canvas.width !== outputWidth) canvas.width = outputWidth;
  if (canvas.height !== outputHeight) canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintSign(context, 0, 0, cssWidth, cssHeight);
}
