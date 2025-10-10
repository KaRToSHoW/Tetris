// Native polyfills
// This file will be used for native platforms (iOS/Android)
// and will import the `text-encoding` package which provides
// TextEncoder/TextDecoder implementations for some environments.

// Use a dynamic require to avoid bundler issues on web
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  require('text-encoding');
} catch (e) {
  // If the package isn't available, we silently ignore on native.
  // On some RN versions it's not necessary.
}
