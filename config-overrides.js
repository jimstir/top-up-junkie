const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Add fallback for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    "crypto": path.resolve(__dirname, "src/utils/crypto-polyfill.js"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("http-browserify"),
    "zlib": path.resolve(__dirname, "src/utils/zlib-mock.js"),
    "assert": require.resolve("assert"),
    "util": require.resolve("util"),
    "querystring": require.resolve("querystring"),
    "events": require.resolve("events"),
    "constants": require.resolve("constants-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "tty": false,
    "child_process": false,
    "vm": false,
  };
  
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
