/**
 * Intro session state.
 *
 * The cinematic introduction plays once per browser session. Navigating around
 * the site (or coming back within the same session) never replays it, so a
 * returning visitor lands straight on the hero and the menu.
 */

export const INTRO_SESSION_KEY = "maitri.intro.v2";
export const INTRO_COMPLETE_EVENT = "maitri:intro-complete";

/** Written before paint by the inline script in the root layout. */
export function willPlayIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) !== "done";
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "done");
  } catch {
    /* Session storage can be blocked; the intro simply plays again next visit. */
  }
}

export function emitIntroComplete(): void {
  markIntroSeen();
  window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT));
}

export function onIntroComplete(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(INTRO_COMPLETE_EVENT, handler);
  return () => window.removeEventListener(INTRO_COMPLETE_EVENT, handler);
}
