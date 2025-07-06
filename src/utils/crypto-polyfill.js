// Custom crypto module with randomUUID support
import cryptoBrowserify from 'crypto-browserify';

// Add randomUUID if it doesn't exist
if (!cryptoBrowserify.randomUUID) {
  cryptoBrowserify.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  };
}

export default cryptoBrowserify;
export * from 'crypto-browserify';
export const randomUUID = cryptoBrowserify.randomUUID;
