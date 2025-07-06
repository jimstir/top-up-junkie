// Mock implementation of @circle-fin/user-controlled-wallets
const mockCircleSDK = {
  // Add mock implementations of the methods you use from the SDK
  // For example:
  initialize: () => ({
    then: (callback) => {
      callback({});
      return { catch: () => {} };
    }
  }),
  // Add other methods as needed
};

// Export the mock implementation
module.exports = mockCircleSDK;
