if (typeof global !== 'undefined') {
  try {
    Object.defineProperty(global, 'localStorage', {
      get() { return undefined; },
      configurable: true
    });
    Object.defineProperty(global, 'sessionStorage', {
      get() { return undefined; },
      configurable: true
    });
  } catch (e) {
    // Ignore errors if properties are not configurable
  }
}
