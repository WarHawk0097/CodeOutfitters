// jsdom implements no CSSOM view module, so `window.matchMedia` is simply absent — every
// component that reads a media query throws on mount. This is an environment gap, not app
// behaviour, so it is filled here rather than guarded for in the components.
//
// The stub reports every query as unmatched, which puts the suite at the narrowest layout.
// jsdom applies no stylesheets either way, so both the mobile and desktop branches of a
// responsive tree are in the DOM regardless; only explicit matchMedia reads see this.
// recharts' ResponsiveContainer observes its box with ResizeObserver, which jsdom does not
// implement. Another environment gap: a no-op stub lets the chart mount (it measures 0×0 and
// draws nothing under jsdom, which is fine — chart geometry is verified in the browser).
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Radix primitives (Select) use Pointer Capture and scrollIntoView, neither implemented by
// jsdom. Stub them so the listbox can open in tests. No-ops are correct: there is no real
// pointer or scrolling to manage under jsdom.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
