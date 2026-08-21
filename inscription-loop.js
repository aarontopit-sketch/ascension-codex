// =====================================================================
// Inscription loop — true text-on-a-path around a card's full perimeter
// =====================================================================
// Replaces the earlier flat top/bottom-strip placeholder. Text now
// actually traces the rounded-rectangle border, corners included, as one
// continuous path — not four runs stitched together.
//
// Fit-handling, in the documented priority order:
//   1. constrained text as given
//   2. letter-spacing adjustment (SVG textLength/lengthAdjust), clamped to
//      roughly the -0.02em..+0.18em range agreed earlier
//   3. repeat the string once with × as divider if still short
//   4. truncate with ellipsis, last resort only, if even compressed to the
//      minimum spacing the text can't fit

const SVG_NS = "http://www.w3.org/2000/svg";

// Rounded-rect path, clockwise, starting at top edge just right of the
// top-left corner — a normal, unbroken loop for textPath to follow.
function roundedRectPath(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z"
  ].join(" ");
}

// Measures a candidate string's natural rendered length at the given
// font, using a throwaway offscreen SVG text node — the only reliable way
// to get real glyph width before committing to layout.
function measureTextLength(text, fontFamily, fontSizePx, letterSpacingEm) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.style.position = "absolute";
  svg.style.visibility = "hidden";
  svg.style.width = "0"; svg.style.height = "0";
  const t = document.createElementNS(SVG_NS, "text");
  t.setAttribute("font-family", fontFamily);
  t.setAttribute("font-size", fontSizePx);
  if (letterSpacingEm) t.style.letterSpacing = letterSpacingEm + "em";
  t.textContent = text;
  svg.appendChild(t);
  document.body.appendChild(svg);
  const len = t.getComputedTextLength();
  document.body.removeChild(svg);
  return len;
}

// Given the loop's actual path length and the base text, decides which
// fit-handling step applies and returns what to render.
//
// Real card perimeters run 600-1000+ px while a short inscription phrase
// at display size is often well under 200px — meaning "repeat with
// divider" is the dominant case in practice. Forcing textLength/
// lengthAdjust to stretch a short string across a much longer path
// spreads glyphs into unreadable gaps rather than even letter-spacing —
// so that's used only for the fine final adjustment once repetition has
// already gotten close, not as the primary mechanism.
function resolveInscriptionFit(baseText, pathLength, fontFamily, fontSizePx) {
  const naturalLen = measureTextLength(baseText, fontFamily, fontSizePx, 0);

  // Text already longer than the loop even once: compress via
  // textLength, unless it would need more than ~35% compression, in
  // which case truncate instead (step 4 — last resort).
  if (naturalLen >= pathLength) {
    if (pathLength / naturalLen >= 0.65) {
      return { text: baseText, useTextLength: true };
    }
    let truncated = baseText;
    while (truncated.length > 4) {
      truncated = truncated.slice(0, -1);
      const tLen = measureTextLength(truncated + "…", fontFamily, fontSizePx, 0);
      if (tLen <= pathLength) return { text: truncated + "…", useTextLength: true };
    }
    return { text: truncated + "…", useTextLength: true };
  }

  // Step 3: repeat with × divider at NATURAL spacing until the repeated
  // text's own length is close to (just under, then one more repeat to
  // just over) the path length. No forced stretching here — repetition
  // alone should get within a small margin, and textLength is only
  // applied at the end for a mild final snap (never a dramatic stretch,
  // which is what produced the sparse/gappy result).
  let repeated = baseText;
  let repeatedLen = naturalLen;
  let guard = 0;
  while (repeatedLen < pathLength && guard < 40) {
    repeated = repeated + "  ×  " + baseText;
    repeatedLen = measureTextLength(repeated, fontFamily, fontSizePx, 0);
    guard++;
  }
  // Only apply textLength if the natural repeated length is already
  // within ~15% of the path length — a mild snap, not a stretch that
  // would re-introduce the gap problem.
  const closeEnough = repeatedLen >= pathLength * 0.85;
  return { text: repeated, useTextLength: closeEnough };
}

let inscriptionIdCounter = 0;

// Mounts one inscription loop into a container. `container` must already
// be in the DOM (so its real rendered size can be measured) and have
// data-inscription-text / data-inscription-color / optionally
// data-inscription-radius / data-inscription-draw-border set.
function mountInscriptionLoop(container) {
  const text = container.dataset.inscriptionText;
  const colorVar = container.dataset.inscriptionColor || "--zone-nav";
  const drawBorder = container.dataset.inscriptionDrawBorder === "true";
  if (!text) return;

  const w = container.offsetWidth;
  const h = container.offsetHeight;
  if (w === 0 || h === 0) return; // not laid out yet, skip silently

  const radius = drawBorder ? 10 : 12; // rounder corners, matching the updated card/input-field border-radius below
  const fontSizePx = drawBorder ? 8 : 7; // smaller and denser — reads as border texture, not a label meant to be read at a glance
  // Split from earlier: genuine runes for input fields (decorative,
  // felt not read), Germania One for display cards (must stay readable).
  const fontFamily = drawBorder ? "Noto Sans Runic, serif" : "Germania One, serif";

  // Inset the path inward from the literal card edge. Text glyphs extend
  // upward from their baseline by default — a path sitting exactly ON the
  // card boundary puts most of the glyph body outside the visible card
  // (above the top edge, right of the right edge, etc.), which is why
  // nothing was visible before this fix. Insetting gives the glyph body
  // room to render inside the card, still hugging the border closely.
  const inset = drawBorder ? fontSizePx * 0.55 : fontSizePx * 0.85;
  const pathW = w - inset * 2, pathH = h - inset * 2;

  const id = "inscription-path-" + (inscriptionIdCounter++);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.classList.add("inscription-loop-svg");

  // Group translated inward by the inset — the path itself is built at
  // pathW×pathH (the smaller, inset rectangle), then shifted into
  // position within the full w×h canvas via this transform.
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("transform", `translate(${inset}, ${inset})`);
  svg.appendChild(group);

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("id", id);
  path.setAttribute("d", roundedRectPath(pathW, pathH, radius));
  path.setAttribute("fill", "none");
  if (drawBorder) {
    path.setAttribute("stroke", `var(${colorVar})`);
    path.setAttribute("stroke-width", "1");
  } else {
    path.setAttribute("stroke", "none");
  }
  group.appendChild(path);

  // measure the real path length via the browser's own geometry engine
  document.body.appendChild(svg);
  const pathLength = path.getTotalLength();
  const fit = resolveInscriptionFit(text, pathLength, fontFamily, fontSizePx);
  document.body.removeChild(svg);

  const textEl = document.createElementNS(SVG_NS, "text");
  textEl.setAttribute("font-family", fontFamily);
  textEl.setAttribute("font-size", fontSizePx);
  textEl.setAttribute("fill", `var(${colorVar})`);
  textEl.style.opacity = "0.95";

  const textPathEl = document.createElementNS(SVG_NS, "textPath");
  textPathEl.setAttribute("href", "#" + id);
  textPathEl.setAttribute("startOffset", "0");
  textPathEl.textContent = fit.text.toUpperCase();
  if (fit.useTextLength) {
    textPathEl.setAttribute("textLength", pathLength);
    textPathEl.setAttribute("lengthAdjust", "spacing");
  }
  textEl.appendChild(textPathEl);
  group.appendChild(textEl);

  container.appendChild(svg);
}

// Call after any render that inserted new .inscription-loop-target
// elements — Dashboard cards, popups, input fields.
function mountAllInscriptionLoops(root) {
  root = root || document;
  root.querySelectorAll(".inscription-loop-target:not([data-mounted])").forEach(el => {
    el.dataset.mounted = "true";
    mountInscriptionLoop(el);
  });
}
