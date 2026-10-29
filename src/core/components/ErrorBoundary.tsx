import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../design-system/tokens/colors';
import { Radii, Spacing } from '../design-system/tokens/spacing';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught exception caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.content}>
              {/* Shield Icon Badge */}
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={38} color={Colors.primary} />
              </View>

              <Text style={styles.title}>Vault Recovered</Text>
              <Text style={styles.subtitle}>
                AAYON encountered an unexpected UI glitch, but your offline encrypted data is 100% safe and intact.
              </Text>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.reloadBtn}
                onPress={this.handleRestart}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={Colors.textInverse} />
                <Text style={styles.reloadBtnText}>Reload Vault & Continue</Text>
              </TouchableOpacity>

              {/* Collapsible Error Diagnostics */}
              <TouchableOpacity
                style={styles.diagToggle}
                onPress={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              >
                <Text style={styles.diagToggleText}>
                  {this.state.showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
                </Text>
                <Ionicons
                  name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {this.state.showDetails && (
                <ScrollView style={styles.diagBox} showsVerticalScrollIndicator={false}>
                  <Text style={styles.diagText}>
                    {this.state.error?.toString() || 'Unknown error'}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.stackText}>
                      {this.state.errorInfo.componentStack.trim()}
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.lg,
    width: '100%',
  },
  reloadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  diagToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.lg,
    padding: 6,
  },
  diagToggleText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  diagBox: {
    marginTop: Spacing.sm,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    maxHeight: 160,
    width: '100%',
  },
  diagText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  stackText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
});
