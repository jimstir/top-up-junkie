// Mock implementation of Node.js 'os' module for browser environment
const os = {
  type: () => 'Browser',
  platform: () => 'browser',
  release: () => '',
  arch: () => 'x64',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  hostname: () => 'browser',
  userInfo: () => ({
    username: 'user',
    uid: 1000,
    gid: 1000,
    shell: null,
    homedir: '/'
  }),
  // Add any other os methods that might be needed
  EOL: '\n',
  constants: {
    // Add any constants that might be needed
  }
};

// Export the mock implementation
module.exports = os;
