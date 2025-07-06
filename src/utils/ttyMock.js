// Mock implementation of Node.js 'tty' module for browser environment
const tty = {
  isatty: () => false,
  ReadStream: class {},
  WriteStream: class {}
};

// Export the mock implementation
module.exports = tty;
