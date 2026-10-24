import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../tokens/colors';
import { Radii, Spacing } from '../tokens/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'glass' | 'highlight';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  default: {
    backgroundColor: Colors.card,
  },
  elevated: {
    backgroundColor: Colors.cardElevated,
    borderColor: Colors.borderLight,
  },
  glass: {
    backgroundColor: Colors.cardGlass,
    borderColor: Colors.borderLight,
  },
  highlight: {
    backgroundColor: Colors.card,
    borderColor: Colors.borderActive,
  },
});
