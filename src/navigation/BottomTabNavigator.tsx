import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { TodayScreen } from '@/features/today/screens/TodayScreen';
import { CareerScreen } from '@/features/career/screens/CareerScreen';
import { HealthScreen } from '@/features/health/screens/HealthScreen';
import { WealthScreen } from '@/features/wealth/screens/WealthScreen';
import { AgentScreen } from '@/features/agent/screens/AgentScreen';
import { Colors } from '@/core/design-system/tokens/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabHeight = 58 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0E0F14',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'today' : 'today-outline'} size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CareerTab"
        component={CareerScreen}
        options={{
          tabBarLabel: 'Career',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthScreen}
        options={{
          tabBarLabel: 'Health',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'fitness' : 'fitness-outline'} size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WealthTab"
        component={WealthScreen}
        options={{
          tabBarLabel: 'Wealth',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AgentTab"
        component={AgentScreen}
        options={{
          tabBarLabel: 'Copilot',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size - 2} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
