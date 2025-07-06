// Custom webpack configuration for handling Node.js core modules and Circle SDK
const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Disable source maps to avoid recursion issues
  config.devtool = false;
  
  // Add fallback for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    // Core Node.js modules with browser polyfills
    "stream": require.resolve("stream-browserify"),
    "path": require.resolve("path-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "tty": path.resolve(__dirname, "../src/utils/ttyMock.js"),
    "crypto": require.resolve("crypto-browserify"),
    "crypto-browserify": require.resolve("crypto-browserify"),
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser"),
    "os": path.resolve(__dirname, "../src/utils/osMock.js"),
    "url": require.resolve("url/"),
    "zlib": false, // Disable zlib as it's causing issues
    "assert": require.resolve("assert/"),
    "util": require.resolve("util/"),
    "querystring": require.resolve("querystring-es3"),
    "events": require.resolve("events/"),
    "constants": require.resolve("constants-browserify"),
    // Set to false to indicate these modules are not needed in the browser
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "vm": false,
  };

  // Add resolve.alias for better module resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    'stream': 'stream-browserify',
    'path': 'path-browserify',
    'https': 'https-browserify',
    'http': 'stream-http',
    'os': path.resolve(__dirname, "../src/utils/osMock.js"),
    'crypto': 'crypto-browserify',
    'util': 'util/'
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(
      /^os$/,
      path.resolve(__dirname, "../src/utils/osMock.js")
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^zlib$/,
      path.resolve(__dirname, "../src/utils/zlibMock.js")
    )
  ];

  // Add rule to handle problematic modules
  config.module.rules.push({
    test: /[\/]node_modules[\/](@circle-fin\/user-controlled-wallets|browserify-zlib|pako)[\/]/,
    use: 'null-loader'
  });

  // Add rule to handle buffer-related modules
  config.module.rules.push({
    test: /[\/]node_modules[\/](buffer|process|util|assert|stream-browserify|readable-stream|inherits|safe-buffer|string_decoder)[\/]/,
    use: 'null-loader'
  });

  return config;
};
