interface AppConfig {
  circle: {
    apiKey: string;
    apiUrl: string;
  };
  google: {
    clientId: string;
    redirectUri: string;
  };
}

const getConfig = (): AppConfig => {
  const apiKey = process.env.REACT_APP_CIRCLE_CLIENT_KEY;
  const apiUrl = process.env.REACT_APP_CIRCLE_CLIENT_URL;
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  if (!apiKey || !apiUrl || !googleClientId) {
    throw new Error('Missing required environment variables');
  }

  return {
    circle: {
      apiKey,
      apiUrl,
    },
    google: {
      clientId: googleClientId,
      redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`,
    },
  };
};

export const config = getConfig();
