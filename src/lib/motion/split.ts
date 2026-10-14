/**
 * Minimal, dependency-free word/line splitter for cinematic headline reveals.
 *
 * Kept deliberately small: we only handle what the design actually uses —
 * plain text plus explicit `<br>` line breaks. Accessibility is preserved by
 * marking the visual split `aria-hidden` and keeping the original string as an
 * `aria-label` on the parent, so screen readers still read one clean sentence.
 */

export interface SplitResult {
  lines: HTMLElement[];
  words: HTMLElement[];
  revert: () => void;
}

const hasChildren = (el: HTMLElement) =>
  Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName !== "BR",
  );

export function splitHeadline(element: HTMLElement): SplitResult | null {
  if (typeof window === "undefined") return null;
  if (element.dataset.split === "done") return null;
  if (hasChildren(element)) return null;

  const originalText = element.textContent ?? "";
  const originalHtml = element.innerHTML;
  const ariaLabel = element.getAttribute("aria-label") ?? originalText.replace(/\s+/g, " ").trim();

  const rawLines = originalHtml
    .split(/<br\s*\/?>|\n/i)
    .map((line) => line.replace(/<[^>]+>/g, "").trim())
    .filter((line) => line.length > 0);

  const fragment = document.createDocumentFragment();
  const lines: HTMLElement[] = [];
  const words: HTMLElement[] = [];

  for (const lineText of rawLines.length > 0 ? rawLines : [originalText]) {
    const lineEl = document.createElement("span");
    lineEl.style.display = "block";
    lineEl.style.overflow = "hidden";

    for (const word of lineText.split(/\s+/)) {
      const wordOuter = document.createElement("span");
      wordOuter.style.display = "inline-block";
      wordOuter.style.overflow = "hidden";
      wordOuter.style.verticalAlign = "top";

      const wordInner = document.createElement("span");
      wordInner.style.display = "inline-block";
      wordInner.style.willChange = "transform, opacity";
      wordInner.textContent = word;

      wordOuter.appendChild(wordInner);
      lineEl.appendChild(wordOuter);
      // Natural word spacing without collapsing the inline-block wrappers.
      lineEl.appendChild(document.createTextNode(" "));
      words.push(wordInner);
    }

    fragment.appendChild(lineEl);
    lines.push(lineEl);
  }

  element.setAttribute("aria-label", ariaLabel);
  element.dataset.split = "done";
  element.replaceChildren(fragment);
  for (const word of words) word.setAttribute("aria-hidden", "true");

  return {
    lines,
    words,
    revert: () => {
      element.removeAttribute("aria-label");
      delete element.dataset.split;
      element.innerHTML = originalHtml;
    },
  };
}
