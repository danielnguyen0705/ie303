export function scrollToTop(behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior,
  });
}

export default scrollToTop;
