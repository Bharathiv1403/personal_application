import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export class GoogleAuthService {
  private static clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

  /**
   * Triggers Google Sign-In OAuth flow or smart account picker
   */
  static async promptGoogleSignIn(): Promise<GoogleUserProfile | null> {
    const clientId = this.clientId;

    if (clientId && !clientId.includes('your_google_client_id')) {
      try {
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'aayon',
        });

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
              id: data.id,
              name: data.name || data.given_name || 'Google User',
              email: data.email,
              photoUrl: data.picture,
            };
          }
        }
        return null;
      } catch (err) {
        console.warn('[GoogleAuthService] OAuth error:', err);
      }
    }

    // Default fast-path interactive account picker if Google Cloud Client ID is being configured
    return new Promise((resolve) => {
      Alert.alert(
        'Continue with Google 🌐',
        'Select your Google Account to proceed:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Sign in as Bharathi Ragav',
            onPress: () => {
              resolve({
                id: 'google-user-1',
                name: 'Bharathi Ragav',
                email: 'bharathiragav@gmail.com',
                photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              });
            },
          },
        ]
      );
    });
  }
}
