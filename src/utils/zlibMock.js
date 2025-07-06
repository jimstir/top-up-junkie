// Mock implementation of Node.js 'zlib' module for browser environment
const zlib = {
  createGzip: () => ({
    on: (event, callback) => {
      if (event === 'data') callback(Buffer.from(''));
      if (event === 'end') callback();
      return this;
    },
    pipe: () => ({
      on: (event, callback) => {
        if (event === 'end') callback();
        return this;
      },
    }),
  }),
  createGunzip: () => ({
    on: (event, callback) => {
      if (event === 'data') callback(Buffer.from(''));
      if (event === 'end') callback();
      return this;
    },
  }),
  Z_NO_FLUSH: 0,
  Z_SYNC_FLUSH: 2,
  Z_FINISH: 4,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  deflate: (buffer, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) {
      process.nextTick(() => callback(null, Buffer.from('')));
    }
    return Buffer.from('');
  },
  deflateSync: () => Buffer.from(''),
  gunzip: (buffer, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) {
      process.nextTick(() => callback(null, Buffer.from('')));
    }
    return Buffer.from('');
  },
  gunzipSync: () => Buffer.from(''),
  gzip: (buffer, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) {
      process.nextTick(() => callback(null, Buffer.from('')));
    }
    return Buffer.from('');
  },
  gzipSync: () => Buffer.from(''),
  inflate: (buffer, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) {
      process.nextTick(() => callback(null, Buffer.from('')));
    }
    return Buffer.from('');
  },
  inflateSync: () => Buffer.from(''),
  unzip: (buffer, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) {
      process.nextTick(() => callback(null, Buffer.from('')));
    }
    return Buffer.from('');
  },
  unzipSync: () => Buffer.from(''),
};

// Export the mock implementation
module.exports = zlib;
