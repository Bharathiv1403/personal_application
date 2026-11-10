import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export type GoogleSignInOutcome =
  | { status: 'success'; user: GoogleUserProfile }
  | { status: 'cancelled'; reason?: string }
  | { status: 'error'; message: string };

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export class GoogleAuthService {
  private static getClientId(): string {
    const raw =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      '117479084723-o6h336o1dst57hit2j59pum1mprh3jot.apps.googleusercontent.com';
    return raw.trim();
  }

  private static getRedirectUri(clientId: string): string {
    const clientPrefix = clientId.split('.')[0];
    const reverseScheme = `com.googleusercontent.apps.${clientPrefix}`;

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      return AuthSession.makeRedirectUri({
        native: `${reverseScheme}:/oauth2redirect`,
        scheme: 'aayon',
        path: 'oauth2redirect',
      });
    }

    return AuthSession.makeRedirectUri({
      scheme: 'aayon',
      path: 'oauth2redirect',
    });
  }

  private static async fetchGoogleProfile(accessToken: string): Promise<GoogleUserProfile | null> {
    const endpoints = [
      'https://openidconnect.googleapis.com/v1/userinfo',
      'https://www.googleapis.com/userinfo/v2/me',
    ];

    for (const url of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok) continue;

        const data = await response.json();
        if (data?.email) {
          return {
            id: String(data.sub || data.id || `google-${Date.now()}`),
            name: String(data.name || data.given_name || data.email.split('@')[0] || 'User').trim(),
            email: String(data.email).trim().toLowerCase(),
            photoUrl: typeof data.picture === 'string' ? data.picture : undefined,
          };
        }
      } catch {
        // Try fallback userinfo endpoint
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return null;
  }

  /**
   * Triggers Google OAuth 2.0 Authorization Code + PKCE flow.
   * Uses ResponseType.Code (required by Google for installed Android/iOS apps; Token is blocked with 400/404).
   */
  static async signInWithGoogle(): Promise<GoogleSignInOutcome> {
    const clientId = this.getClientId();

    if (
      !clientId ||
      clientId.includes('your_google_client_id') ||
      clientId.includes('your_oauth_client_id')
    ) {
      return {
        status: 'error',
        message: 'Google OAuth Client ID is not configured for this build.',
      };
    }

    try {
      const redirectUri = this.getRedirectUri(clientId);

      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        scopes: [
          'openid',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          prompt: 'select_account',
        },
      });

      const result = await request.promptAsync(GOOGLE_DISCOVERY);

      if (result.type === 'success') {
        let accessToken = result.params?.access_token;

        if (!accessToken && result.params?.code) {
          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId,
              code: result.params.code,
              redirectUri,
              extraParams: request.codeVerifier
                ? { code_verifier: request.codeVerifier }
                : undefined,
            },
            GOOGLE_DISCOVERY
          );
          accessToken = tokenResponse.accessToken;
        }

        if (!accessToken) {
          return {
            status: 'error',
            message: 'Google sign-in succeeded but no access token could be exchanged.',
          };
        }

        const profile = await this.fetchGoogleProfile(accessToken);
        if (!profile) {
          return {
            status: 'error',
            message: 'Could not retrieve your Google profile details. Please check your network.',
          };
        }

        return { status: 'success', user: profile };
      }

      if (result.type === 'error') {
        const desc =
          result.error?.description ||
          result.error?.message ||
          result.params?.error_description ||
          result.params?.error ||
          'Google OAuth could not complete redirect.';
        return { status: 'error', message: desc };
      }

      if (result.type === 'locked') {
        return {
          status: 'error',
          message: 'Another sign-in window is already open.',
        };
      }

      return {
        status: 'cancelled',
        reason: 'Browser session was closed before completing Google sign-in.',
      };
    } catch (err: any) {
      console.warn('[GoogleAuthService] OAuth error:', err);
      return {
        status: 'error',
        message: err?.message || 'Could not complete Google authentication.',
      };
    }
  }
}
