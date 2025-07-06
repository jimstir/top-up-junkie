const webpack = require('webpack');
const path = require('path');

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  return {
    resolve: {
      fallback: {
        // Core Node.js modules with browser polyfills
        "stream": require.resolve("stream-browserify"),
        "stream/web": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "tty": require.resolve("tty-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "crypto-browserify": require.resolve("crypto-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
        "os": path.resolve(__dirname, "src/utils/osMock.js"),
        "url": require.resolve("url/"),
        "zlib": require.resolve("browserify-zlib"),
        "assert": require.resolve("assert/"),
        "util": require.resolve("util/"),
        "querystring": require.resolve("querystring-es3"),
        "events": require.resolve("events/"),
        "constants": require.resolve("constants-browserify"),
        "https-browserify": require.resolve("https-browserify"),
        "http-browserify": require.resolve("stream-http"),
        // Set to false to indicate these modules are not needed in the browser
        "fs": false,
        "net": false,
        "tls": false,
        "child_process": false,
        "vm": false,
      },
      alias: {
        'stream': 'stream-browserify',
        'path': 'path-browserify',
        'https': 'https-browserify',
        'http': 'stream-http',
        'os': path.resolve(__dirname, "src/utils/osMock.js"),
        'crypto': 'crypto-browserify',
        'util': 'util/'
      },
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx']
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\/!\$\w+\/!\//
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^os$/,
        path.resolve(__dirname, "src/utils/osMock.js")
      )
    ],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.m?js$/,
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            compact: false,
            presets: [
              [
                require.resolve('babel-preset-react-app/dependencies'),
                { helpers: true },
              ],
            ],
            cacheDirectory: true,
            cacheCompression: false,
            sourceMaps: true,
          },
        }
      ]
    },
    node: {
      global: true,
      __filename: true,
      __dirname: true,
    },
    ignoreWarnings: [/Failed to parse source map/],
  };
};
