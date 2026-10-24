import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../tokens/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  disableBottomInset?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  disableBottomInset = false,
}) => {
  return (
    <SafeAreaView
      style={[styles.container, style]}
      edges={['top', 'left', 'right', ...(disableBottomInset ? [] : (['bottom'] as const))]}
    >
      <StatusBar style="light" />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});
