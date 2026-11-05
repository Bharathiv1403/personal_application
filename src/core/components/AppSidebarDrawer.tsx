import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { useSidebarStore } from '@/core/state/sidebar-store';
import { useEnglishLearningStore } from '@/features/learning/state/english-learning-store';
import { useMessageWriterStore } from '@/features/career/state/message-writer-store';
import { useVaultStore } from '@/features/vault/state/vault-store';
import { useTamilCalendarStore } from '@/features/calendar/state/tamil-calendar-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(335, Math.round(SCREEN_WIDTH * 0.84));

export const AppSidebarDrawer: React.FC = () => {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const closeSidebar = useSidebarStore((s) => s.closeSidebar);

  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const navigateToTab = (tabName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    closeSidebar();
    setTimeout(() => {
      navigation.navigate('MainTabs', { screen: tabName });
    }, 150);
  };

  const navigateToScreen = (screenName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    closeSidebar();
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 150);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Lock Vault / Logout',
      'Are you sure you want to log out and lock your personal session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout 🔒',
          style: 'destructive',
          onPress: () => {
            closeSidebar();
            signOut();
          },
        },
      ]
    );
  };

  const appSpaces = [
    {
      id: 'today',
      name: 'Today Dashboard',
      sub: 'Focus, habits & daily briefing',
      icon: 'today-outline' as const,
      color: Colors.primary,
      action: () => navigateToTab('TodayTab'),
    },
    {
      id: 'career',
      name: 'CareerPilot OS',
      sub: '140+ roles, auto-apply & coaching',
      icon: 'briefcase-outline' as const,
      color: '#38BDF8',
      action: () => navigateToTab('CareerTab'),
    },
    {
      id: 'wealth',
      name: 'Wealth & Budget',
      sub: 'Pots, budgets & UPI cashflow',
      icon: 'wallet-outline' as const,
      color: '#F59E0B',
      action: () => navigateToTab('WealthTab'),
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      sub: 'Steps, screen-time & water logs',
      icon: 'fitness-outline' as const,
      color: '#EC4899',
      action: () => navigateToTab('HealthTab'),
    },
    {
      id: 'agent',
      name: 'AI Copilot Agent',
      sub: 'Task automation & intelligent memory',
      icon: 'sparkles-outline' as const,
      color: '#A855F7',
      action: () => navigateToTab('AgentTab'),
    },
  ];

  const hiddenTools = [
    {
      id: 'tamil-calendar',
      name: 'Tamil Calendar & Panchangam 🕉️',
      sub: 'தினசரி நாள்காட்டி, நல்ல நேரம் & பஞ்சாங்கம்',
      icon: 'calendar-outline' as const,
      color: '#F59E0B',
      tag: 'தமிழ்',
      action: () => {
        closeSidebar();
        setTimeout(() => {
          useTamilCalendarStore.getState().openModal();
        }, 150);
      },
    },
    {
      id: 'english-daily',
      name: 'English Daily Guide',
      sub: 'Lessons, sentence builder & translator',
      icon: 'book-outline' as const,
      color: '#38BDF8',
      tag: 'Day 1',
      action: () => {
        closeSidebar();
        setTimeout(() => {
          useEnglishLearningStore.getState().openModal();
        }, 150);
      },
    },
    {
      id: 'email-writer',
      name: 'Email & Message Writer',
      sub: 'Leave, WFH, hike & client email templates',
      icon: 'mail-outline' as const,
      color: '#10B981',
      tag: 'AI',
      action: () => {
        closeSidebar();
        setTimeout(() => {
          useMessageWriterStore.getState().openModal();
        }, 150);
      },
    },
    {
      id: 'vault-password-manager',
      name: 'Password Vault & 2FA',
      sub: 'KeePass credentials & live authenticator',
      icon: 'shield-checkmark-outline' as const,
      color: '#6366F1',
      tag: '2FA',
      action: () => {
        closeSidebar();
        setTimeout(() => {
          useVaultStore.getState().openModal();
        }, 150);
      },
    },
    {
      id: 'todo',
      name: 'Tasks & Priorities',
      sub: 'Checklists & Eisenhower matrix',
      icon: 'checkbox-outline' as const,
      color: '#60A5FA',
      action: () => navigateToScreen('TodoList'),
    },
    {
      id: 'career-hub',
      name: 'Career Tools Hub',
      sub: 'ATS resume, flashcards & mock interviews',
      icon: 'apps-outline' as const,
      color: '#38BDF8',
      tag: '12 Tools',
      action: () => navigateToTab('CareerTab'),
    },
    {
      id: 'settings-hub',
      name: 'Security & App Settings',
      sub: 'Biometrics, auto-lock & update checker',
      icon: 'settings-outline' as const,
      color: '#94A3B8',
      action: () => navigateToScreen('Settings'),
    },
  ];

  const filteredSpaces = appSpaces.filter((item) =>
    !searchQuery.trim() ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTools = hiddenTools.filter((item) =>
    !searchQuery.trim() ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userInitial = (user?.name || 'User').charAt(0).toUpperCase();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSidebar}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to close */}
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sidebar Container (Sliding from Left) */}
        <View style={styles.sidebar}>
          {/* Header / User Profile */}
          <View style={styles.sidebarHeader}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Personal User'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || 'Encrypted Vault'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={closeSidebar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.vaultStatusRow}>
              <View style={styles.vaultStatusDot} />
              <Text style={styles.vaultStatusText}>AES-256 Vault</Text>
              <Text style={styles.vaultStatusSep}>•</Text>
              <Ionicons name="finger-print" size={11} color="#10B981" />
              <Text style={styles.vaultStatusText}>Biometrics</Text>
            </View>
          </View>

          {/* Quick Search Bar */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={15} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search features..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Nav Items List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {/* Main Spaces */}
            <Text style={styles.sectionHeading}>SPACES</Text>
            {filteredSpaces.map((space) => (
              <TouchableOpacity
                key={space.id}
                style={styles.navRow}
                activeOpacity={0.7}
                onPress={space.action}
              >
                <View
                  style={[
                    styles.navIconBox,
                    { backgroundColor: space.color + '18', borderColor: space.color + '30' },
                  ]}
                >
                  <Ionicons name={space.icon} size={18} color={space.color} />
                </View>
                <View style={styles.navTextCol}>
                  <Text style={styles.navTitle} numberOfLines={1}>
                    {space.name}
                  </Text>
                  <Text style={styles.navSub} numberOfLines={1}>
                    {space.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}

            {/* Hidden & Power Tools */}
            <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
              POWER TOOLS
            </Text>
            {filteredTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.navRow}
                activeOpacity={0.7}
                onPress={tool.action}
              >
                <View
                  style={[
                    styles.navIconBox,
                    { backgroundColor: tool.color + '18', borderColor: tool.color + '30' },
                  ]}
                >
                  <Ionicons name={tool.icon} size={18} color={tool.color} />
                </View>
                <View style={styles.navTextCol}>
                  <View style={styles.navTitleRow}>
                    <Text style={styles.navTitle} numberOfLines={1}>
                      {tool.name}
                    </Text>
                    {tool.tag && (
                      <View style={[styles.microTag, { backgroundColor: tool.color + '20', borderColor: tool.color + '45' }]}>
                        <Text style={[styles.microTagText, { color: tool.color }]}>{tool.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.navSub} numberOfLines={1}>
                    {tool.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ========================================================= */}
          {/* PINNED BOTTOM BAR: SETTINGS & LOGOUT */}
          {/* ========================================================= */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.footerActionBtn}
              activeOpacity={0.8}
              onPress={() => navigateToScreen('Settings')}
            >
              <View style={styles.footerIconCircle}>
                <Ionicons name="settings-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={styles.footerActionText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.footerActionDivider} />

            <TouchableOpacity
              style={[styles.footerActionBtn, styles.logoutActionBtn]}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <View style={[styles.footerIconCircle, styles.logoutIconCircle]}>
                <Ionicons name="log-out-outline" size={18} color="#F87171" />
              </View>
              <Text style={[styles.footerActionText, { color: '#F87171' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#0F1117',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Platform.OS === 'ios' ? 50 : 28,
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  sidebarHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },
  vaultStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  vaultStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  vaultStatusSep: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
  },
  scrollList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
    gap: 10,
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navTextCol: {
    flex: 1,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  navTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  microTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  microTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Bottom pinned footer
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0A0C10',
    gap: 10,
  },
  footerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoutActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  footerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerActionDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
