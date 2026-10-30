import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { useWealthStore, GroceryItem } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  { name: 'Cow Milk 1L 🥛', price: 60, category: 'dairy' as const },
  { name: 'Rice 5kg 🌾', price: 320, category: 'provisions' as const },
  { name: 'Cooking Oil 1L 🛢️', price: 150, category: 'provisions' as const },
  { name: 'Tomatoes 1kg 🍅', price: 40, category: 'vegetables' as const },
  { name: 'Onions 1kg 🧅', price: 50, category: 'vegetables' as const },
  { name: 'Eggs (Pack of 12) 🥚', price: 85, category: 'provisions' as const },
  { name: 'Dishwash Soap 🧼', price: 45, category: 'household' as const },
  { name: 'Tea Powder 500g ☕', price: 180, category: 'provisions' as const },
];

export const GroceryListModal: React.FC<Props> = ({ visible, onClose }) => {
  const groceries = useWealthStore((s) => s.groceries);
  const addGroceryItem = useWealthStore((s) => s.addGroceryItem);
  const toggleGroceryItem = useWealthStore((s) => s.toggleGroceryItem);
  const deleteGroceryItem = useWealthStore((s) => s.deleteGroceryItem);
  const clearPurchasedGroceries = useWealthStore((s) => s.clearPurchasedGroceries);
  const addTransaction = useWealthStore((s) => s.addTransaction);
  const accounts = useWealthStore((s) => s.accounts);

  const [activeTab, setActiveTab] = useState<'all' | 'provisions' | 'vegetables' | 'dairy' | 'household'>('all');
  const [itemName, setItemName] = useState('');
  const [approxPrice, setApproxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GroceryItem['category']>('provisions');

  const filteredGroceries = groceries.filter((g) => {
    if (activeTab === 'all') return true;
    return g.category === activeTab;
  });

  const totalEstimated = groceries.reduce((sum, g) => sum + (g.approxPrice || 0), 0);
  const inCartTotal = groceries.filter((g) => g.isPurchased).reduce((sum, g) => sum + (g.approxPrice || 0), 0);
  const purchasedCount = groceries.filter((g) => g.isPurchased).length;

  const handleAddItem = (name?: string, price?: number, cat?: GroceryItem['category']) => {
    const finalName = name || itemName.trim();
    const finalPrice = price !== undefined ? price : parseInt(approxPrice, 10) || 0;
    const finalCat = cat || selectedCategory;

    if (!finalName) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addGroceryItem(finalName, finalPrice, finalCat);
    if (!name) {
      setItemName('');
      setApproxPrice('');
    }
  };

  const handleToggle = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toggleGroceryItem(id);
  };

  const handleCheckoutToExpense = () => {
    if (inCartTotal <= 0) {
      Alert.alert('No Items In Cart', 'Tap items to mark them as purchased before checkout.');
      return;
    }

    const defaultAcc = accounts[0]?.id || '';

    Alert.alert(
      'Checkout Cart 🛒',
      `Add ₹${inCartTotal.toLocaleString('en-IN')} as a grocery expense to your Wealth ledger?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record Expense',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            addTransaction({
              title: `Grocery Market Run (${purchasedCount} items)`,
              amount: inCartTotal,
              type: 'expense',
              categoryId: 'groceries',
              accountId: defaultAcc,
              date: new Date().toISOString().slice(0, 10),
              paymentMethod: 'UPI',
              merchant: 'Supermarket / Veggie Market',
            });
            clearPurchasedGroceries();
            Alert.alert('Logged! 🎉', `₹${inCartTotal.toLocaleString('en-IN')} expense recorded.`);
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Family Grocery Checklist 🛒</Text>
            <Text style={styles.headerSubtitle}>Real-time shopping total & market list</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Live Running Total Banner */}
        <View style={styles.totalBanner}>
          <View>
            <Text style={styles.totalLabel}>IN-CART TOTAL (PURCHASED)</Text>
            <Text style={styles.inCartText}>{formatINR(inCartTotal)}</Text>
            <Text style={styles.estimatedText}>
              List Estimate: {formatINR(totalEstimated)} ({purchasedCount}/{groceries.length} items)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, inCartTotal <= 0 && styles.disabledBtn]}
            onPress={handleCheckoutToExpense}
            disabled={inCartTotal <= 0}
          >
            <Ionicons name="bag-check" size={18} color="#09090B" />
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Template Chips */}
        <View style={styles.templateSection}>
          <Text style={styles.sectionSmallTitle}>Quick 1-Tap Add Items:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
            {TEMPLATES.map((t, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.templateChip}
                onPress={() => handleAddItem(t.name, t.price, t.category)}
              >
                <Text style={styles.templateChipText}>{t.name} (₹{t.price})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add Item Form */}
        <View style={styles.addForm}>
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Item name (e.g. Potatoes 2kg)"
              placeholderTextColor={Colors.textMuted}
              value={itemName}
              onChangeText={setItemName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="₹ Approx"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              value={approxPrice}
              onChangeText={setApproxPrice}
            />
            <TouchableOpacity style={styles.addItemBtn} onPress={() => handleAddItem()}>
              <Ionicons name="add" size={20} color="#09090B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'provisions', 'vegetables', 'dairy', 'household'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1, 5)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredGroceries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="basket-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No items in this category. Tap quick templates above to add!</Text>
            </View>
          ) : (
            filteredGroceries.map((item) => (
              <View
                key={item.id}
                style={[styles.groceryRow, item.isPurchased && styles.groceryRowDone]}
              >
                <TouchableOpacity
                  style={styles.groceryLeft}
                  activeOpacity={0.8}
                  onPress={() => handleToggle(item.id)}
                >
                  <Ionicons
                    name={item.isPurchased ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={item.isPurchased ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.groceryName, item.isPurchased && styles.groceryNameDone]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>

                <View style={styles.groceryRight}>
                  <Text style={[styles.groceryPrice, item.isPurchased && styles.groceryPriceDone]}>
                    ₹{item.approxPrice || 0}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteGroceryItem(item.id)}
                  >
                    <Ionicons name="close" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: Spacing.screenPadding,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  inCartText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  estimatedText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  templateSection: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
  },
  sectionSmallTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  templateScroll: {
    gap: 8,
  },
  templateChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  templateChipText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  addForm: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  addItemBtn: {
    width: 42,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.cardElevated,
    borderColor: Colors.cyan,
  },
  tabText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.cyan,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
    gap: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  groceryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groceryRowDone: {
    opacity: 0.6,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  groceryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  groceryName: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  groceryNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  groceryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groceryPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
  },
  groceryPriceDone: {
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
});
