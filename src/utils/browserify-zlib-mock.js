// Mock implementation of browserify-zlib
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
  gzipSync: () => Buffer.from(''),
  gunzipSync: () => Buffer.from(''),
  deflateSync: () => Buffer.from(''),
  inflateSync: () => Buffer.from(''),
};

module.exports = zlib;
