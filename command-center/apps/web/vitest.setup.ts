// jsdom implements no CSSOM view module, so `window.matchMedia` is simply absent — every
// component that reads a media query throws on mount. This is an environment gap, not app
// behaviour, so it is filled here rather than guarded for in the components.
//
// The stub reports every query as unmatched, which puts the suite at the narrowest layout.
// jsdom applies no stylesheets either way, so both the mobile and desktop branches of a
// responsive tree are in the DOM regardless; only explicit matchMedia reads see this.
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
