import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../tokens/colors';
import { Radii, Spacing } from '../tokens/spacing';

export type BadgeVariant = 'primary' | 'cyan' | 'purple' | 'gold' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, textStyles[variant], textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: Colors.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cyan: {
    backgroundColor: Colors.cyanGlow,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  purple: {
    backgroundColor: Colors.purpleGlow,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  gold: {
    backgroundColor: Colors.goldGlow,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  danger: {
    backgroundColor: Colors.dangerGlow,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  neutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.border,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

const textStyles = StyleSheet.create({
  primary: { color: Colors.primary },
  cyan: { color: Colors.cyan },
  purple: { color: Colors.purple },
  gold: { color: Colors.gold },
  danger: { color: Colors.danger },
  neutral: { color: Colors.textSecondary },
});
