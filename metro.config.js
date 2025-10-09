const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver configuration to handle Node.js modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude Node.js specific modules that shouldn't be bundled
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/ws\/.*/,
  /node_modules\/.*\/node_modules\/bufferutil\/.*/,
  /node_modules\/.*\/node_modules\/utf-8-validate\/.*/,
];

// Transform configuration
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Configure for web platform
config.resolver.alias = {
  'crypto': 'react-native-url-polyfill/js/urlsearchparams-polyfill.js',
  'stream': 'stream-browserify',
  'http': '@expo/webpack-config/web-default/react-native-web.js',
  'https': '@expo/webpack-config/web-default/react-native-web.js',
  'os': 'react-native-url-polyfill/js/urlsearchparams-polyfill.js',
  'url': 'react-native-url-polyfill',
};

module.exports = config;