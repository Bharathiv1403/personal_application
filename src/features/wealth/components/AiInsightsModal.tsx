import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore } from '../state/wealth-store';
import { AIService } from '@/core/utils/ai-service';
import { formatINR } from '@/core/utils/currency';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AiInsightsModal: React.FC<Props> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState('');

  const accounts = useWealthStore((s) => s.accounts);
  const transactions = useWealthStore((s) => s.transactions);
  const budgets = useWealthStore((s) => s.budgets);
  const bills = useWealthStore((s) => s.bills);

  const fetchAiInsight = async () => {
    setLoading(true);
    setInsight('');

    // Compute metrics
    const totalBalance = accounts
      .filter((a) => a.type !== 'credit_card')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySpend: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categorySpend[t.categoryId] = (categorySpend[t.categoryId] || 0) + t.amount;
      });

    const topCategories = Object.entries(categorySpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`)
      .join(', ');

    const overallBudget = budgets.find((b) => !b.categoryId)?.amount || 50000;
    const budgetBurnPercent = Math.round((totalExpense / overallBudget) * 100);

    const pendingBillsCount = bills.filter((b) => !b.isPaid).length;

    const prompt = `You are AAYON Executive AI Financial Advisor. Analyze Bharathi's personal finances and provide an energetic, high-value financial review.
Metrics:
- Total Bank/Cash Balance: ${formatINR(totalBalance)}
- This Month Inflow (Income): ${formatINR(totalIncome)}
- This Month Outflow (Expenses): ${formatINR(totalExpense)}
- Monthly Budget: ${formatINR(overallBudget)} (${budgetBurnPercent}% utilized)
- Top Expense Categories: ${topCategories || 'None recorded'}
- Pending Bills Due: ${pendingBillsCount}

Give 3 crisp, executive bullet points:
1. 💡 Spending Health & Budget Velocity Analysis
2. ⚠️ Risk / Optimization Flag (e.g. food/shopping overspend, pending bills)
3. 🎯 Actionable Wealth Growth Tip (How to save 15-20% more this month)
Keep tone concise, executive, empowering, under 150 words.`;

    try {
      const reply = await AIService.generateReply(prompt, []);
      setInsight(reply);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      setInsight('Unable to generate AI insights at the moment. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAiInsight();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.modalTitle}>AI Financial Insights</Text>
                <Text style={styles.modalSubtitle}>Powered by Groq Llama 3.3 & Gemini AI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing cash flow & spending patterns...</Text>
              </View>
            ) : (
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchAiInsight} disabled={loading}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh AI Analysis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 36,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.lg,
  },
  insightText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
