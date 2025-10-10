const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver configuration to handle Node.js modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude Node.js specific modules that shouldn't be bundled
config.resolver.blockList = [
  // WebSocket libraries that don't work in React Native
  /node_modules\/.*\/node_modules\/ws\/.*/,
  /node_modules\/ws\/.*/,
  /node_modules\/.*\/node_modules\/bufferutil\/.*/,
  /node_modules\/bufferutil\/.*/,
  /node_modules\/.*\/node_modules\/utf-8-validate\/.*/,
  /node_modules\/utf-8-validate\/.*/,
  
  // Other problematic Node.js modules
  /node_modules\/.*\/node_modules\/node-fetch\/.*/,
  /node_modules\/.*\/node_modules\/fs\/.*/,
  /node_modules\/.*\/node_modules\/path\/.*/,
];

// Transform configuration optimized for performance
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Additional performance optimizations
config.transformer.minifierConfig = {
  mangle: false, // Disable mangling for better debugging
};

// Cache configuration for faster rebuilds
// config.cacheStores = [
//   {
//     name: 'filesystem', 
//     directory: '/tmp/metro-cache',
//   },
// ];

// Configure polyfills for React Native
config.resolver.alias = {
  // Node.js polyfills
  'crypto': false, // Disable crypto entirely as it's not available in RN
  'stream': false,
  'http': false,
  'https': false, 
  'fs': false,
  'path': false,
  'os': false,
  'net': false,
  'tls': false,
  'child_process': false,
  'dns': false,
  
  // URL polyfill for React Native
  'url': 'react-native-url-polyfill',
  
  // WebSocket polyfills
  'ws': false, // Completely disable ws
  'bufferutil': false,
  'utf-8-validate': false,
};

module.exports = config;