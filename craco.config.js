const { override, addWebpackModuleRule, addWebpackPlugin, addWebpackAlias } = require('@craco/craco');
const webpack = require('webpack');
const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// Disable source maps to avoid recursion issues
process.env.GENERATE_SOURCEMAP = 'false';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable source maps
      webpackConfig.devtool = false;

      // Add fallback for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        // Core Node.js modules with browser polyfills
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "tty": path.resolve(__dirname, "src/utils/ttyMock.js"),
        "crypto": require.resolve("crypto-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
        "os": path.resolve(__dirname, "src/utils/osMock.js"),
        "url": require.resolve("url/"),
        "zlib": path.resolve(__dirname, "src/utils/browserify-zlib-mock.js"),
        "browserify-zlib": path.resolve(__dirname, "src/utils/browserify-zlib-mock.js"),
        "@circle-fin/user-controlled-wallets": path.resolve(__dirname, "src/utils/circle-sdk-mock.js"),
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

      // Explicitly set module resolution order
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        'node_modules',
      ];

      // Add rule to handle problematic modules
      webpackConfig.module.rules.push({
        test: /[\\/]node_modules[\\/](browserify-zlib|@circle-fin\/user-controlled-wallets)[\\/]/,
        use: 'null-loader',
      });

      // Add rule to handle buffer-related modules
      webpackConfig.module.rules.push({
        test: /[\\/]node_modules[\\/](buffer|process|util|assert|stream-browserify|readable-stream|inherits|safe-buffer|string_decoder)[\\/]/,
        use: 'null-loader',
      });

      // Add plugins
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        new NodePolyfillPlugin({
          excludeAliases: ['console']
        })
      ];

      // Add fallback for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "util": require.resolve("util/"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
        "assert": require.resolve("assert/"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": path.resolve(__dirname, "src/utils/osMock.js"),
        "url": require.resolve("url/"),
        "zlib": path.resolve(__dirname, "src/utils/browserify-zlib-mock.js"),
        "browserify-zlib": path.resolve(__dirname, "src/utils/browserify-zlib-mock.js"),
        "@circle-fin/user-controlled-wallets": path.resolve(__dirname, "src/utils/circle-sdk-mock.js"),
        "querystring": require.resolve("querystring-es3"),
        "events": require.resolve("events/"),
        "constants": require.resolve("constants-browserify"),
        "fs": false,
        "net": false,
        "tls": false,
        "child_process": false,
        "vm": false,
      };

      return webpackConfig;
    },
  },
  
  // Configure the dev server
  devServer: (configFunction) => {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      config.client = {
        overlay: {
          errors: true,
          warnings: false,
        },
      };
      return config;
    };
  },
};
