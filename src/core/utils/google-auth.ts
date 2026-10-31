import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Alert, Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export class GoogleAuthService {
  private static clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    '117479084723-o6h336o1dst57hit2j59pum1mprh3jot.apps.googleusercontent.com';

  /**
   * Triggers Google Sign-In OAuth flow with account picker
   */
  static async promptGoogleSignIn(): Promise<GoogleUserProfile | null> {
    const clientId = this.clientId;

    if (clientId && !clientId.includes('your_google_client_id')) {
      try {
        // Reverse DNS scheme for Android OAuth Client ID
        const clientPrefix = clientId.split('.')[0];
        const reverseScheme = `com.googleusercontent.apps.${clientPrefix}`;
        const redirectUri = Platform.OS === 'android'
          ? `${reverseScheme}:/oauth2redirect`
          : AuthSession.makeRedirectUri({ scheme: 'aayon' });

        const discovery = {
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
          revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
        };

        const request = new AuthSession.AuthRequest({
          clientId,
          redirectUri,
          scopes: ['openid', 'profile', 'email'],
          responseType: AuthSession.ResponseType.Token,
          extraParams: {
            prompt: 'select_account',
          },
        });

        const result = await request.promptAsync(discovery);

        if (result.type === 'success' && result.params?.access_token) {
          // Fetch Google User Profile
          const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${result.params.access_token}` },
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.id || `google-${Date.now()}`,
              name: data.name || data.given_name || 'Google User',
              email: data.email,
              photoUrl: data.picture,
            };
          }
        }
        return null;
      } catch (err) {
        console.warn('[GoogleAuthService] OAuth error:', err);
        Alert.alert(
          'Google Sign-In Failed',
          'Could not complete Google authentication. Please check your internet connection or use manual registration.'
        );
        return null;
      }
    }

    Alert.alert(
      'Google Sign-In',
      'Google Client ID is not configured. Please register manually with your name, email and PIN.'
    );
    return null;
  }
}
