/**
 * Meta SDK Configuration
 * Public values are safe to commit since they're exposed to the browser anyway.
 * Server-side secrets (META_APP_SECRET, META_WHATSAPP_REDIRECT_URI) remain in environment variables.
 */

export const META_CONFIG = {
  appId: '846109078108808',
  whatsappConfigId: '4206423082947827',
  version: 'v24.0',
  // OAuth callback for Meta's server-side redirect
  oauthCallbackUri: 'https://brancr.onrender.com/api/oauth/meta/callback',
  // Embedded signup redirect URI (frontend page where FB.login is called)
  embeddedSignupRedirectUri: 'https://www.brancr.com/app/integrations',
  // Backend API base URL (Go service - using api.brancr.com so cookies are sent)
  backendUrl: 'https://api.brancr.com',
} as const;

// Server-side only - keep in environment variables
export const getMetaSecret = () => {
  if (typeof window !== 'undefined') {
    throw new Error('META_APP_SECRET cannot be accessed on the client side');
  }
  return process.env.META_APP_SECRET!;
};

