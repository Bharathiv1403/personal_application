import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TRIP_TEMPLATES = [
  'Goa Bike Trip 🏍️',
  'Kodaikanal Tour 🏔️',
  'Valparai Ride 🌲',
  'Kerala Vacation 🌴',
  'Ooty Friends Tour 🚗',
  'Weekend Trekking 🏕️',
];

export const AddTripModal: React.FC<Props> = ({ visible, onClose }) => {
  const [tripType, setTripType] = useState<'solo' | 'group'>('group');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>(['Me']);
  const [initialContribution, setInitialContribution] = useState('');

  const addTrip = useWealthStore((s) => s.addTrip);

  React.useEffect(() => {
    if (visible) {
      setTripType('group');
      setName('');
      setBudget('');
      setMemberInput('');
      setMembers(['Me']);
      setInitialContribution('');
    }
  }, [visible]);

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) {
      Alert.alert('Duplicate Member', 'This member is already in the list.');
      return;
    }
    setMembers([...members, trimmed]);
    setMemberInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRemoveMember = (idx: number) => {
    if (members.length <= 1) {
      Alert.alert('Required', 'A group trip must have at least one member.');
      return;
    }
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Trip Name Required', 'Please enter a name for the trip (e.g. Kodaikanal Tour).');
      return;
    }

    const numBudget = parseFloat(budget.trim()) || 0;
    const numContrib = parseFloat(initialContribution.trim()) || 0;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const isSolo = tripType === 'solo';
    const finalMembers = isSolo ? ['Me (Self)'] : members;
    const contributions =
      !isSolo && numContrib > 0
        ? finalMembers.map((m) => ({
            memberName: m,
            amount: numContrib,
          }))
        : [];

    addTrip(name.trim(), numBudget, finalMembers, contributions, tripType);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Plan New Trip / Tour</Text>
              <Text style={styles.modalSubtitle}>Single (Solo) alladhu Friends / Group trip plan pannunga</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Trip Type Selector: Solo vs Group */}
            <Text style={styles.fieldLabel}>Trip Type (யாருடன் போகிறீர்கள்?)</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeButton, tripType === 'solo' && styles.typeButtonActive]}
                onPress={() => {
                  setTripType('solo');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
              >
                <View style={[styles.typeIconWrap, tripType === 'solo' && styles.typeIconWrapActive]}>
                  <Ionicons name="person" size={18} color={tripType === 'solo' ? '#FFFFFF' : '#38BDF8'} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.typeButtonTitle, tripType === 'solo' && styles.typeButtonTitleActive]}>
                    Solo Trip (தனி ஆள்)
                  </Text>
                  <Text style={styles.typeButtonSub}>Just me, personal budget</Text>
                </View>
                {tripType === 'solo' && (
                  <Ionicons name="checkmark-circle" size={18} color="#38BDF8" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, tripType === 'group' && styles.typeButtonActive]}
                onPress={() => {
                  setTripType('group');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
              >
                <View style={[styles.typeIconWrap, tripType === 'group' && styles.typeIconWrapActive]}>
                  <Ionicons name="people" size={18} color={tripType === 'group' ? '#FFFFFF' : '#A855F7'} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.typeButtonTitle, tripType === 'group' && styles.typeButtonTitleActive]}>
                    Friends / Team (நண்பர்கள்)
                  </Text>
                  <Text style={styles.typeButtonSub}>Common pool & splitwise</Text>
                </View>
                {tripType === 'group' && (
                  <Ionicons name="checkmark-circle" size={18} color="#A855F7" />
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Templates */}
            <Text style={styles.fieldLabel}>Quick Destinations</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {TRIP_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => {
                    setName(tmpl.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim());
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }}
                >
                  <Text style={styles.templateChipText}>{tmpl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Trip Name */}
            <Text style={styles.fieldLabel}>Trip Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={tripType === 'solo' ? 'e.g. Solo Bike Ride to Valparai' : 'e.g. Ooty Friends Trip 2026'}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Total Budget */}
            <Text style={styles.fieldLabel}>
              {tripType === 'solo' ? 'My Solo Budget (₹)' : 'Total Estimated Group Budget (₹)'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={tripType === 'solo' ? 'e.g. 8000' : 'e.g. 25000'}
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />

            {/* Conditional: Solo Hint vs Group Members */}
            {tripType === 'solo' ? (
              <View style={styles.soloHintCard}>
                <Ionicons name="information-circle" size={20} color="#38BDF8" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.soloHintTitle}>Solo Trip Mode Active</Text>
                  <Text style={styles.soloHintDesc}>
                    Group split and pool calculation thevai illa. Ungaloda Petrol/Diesel, Room Stay, Food, and Bike/Car maintenance expenses mattum direct-ah track aagum.
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Members in Tour */}
                <Text style={styles.fieldLabel}>Tour Members / Friends</Text>
                <View style={styles.memberInputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Add friend (e.g. Arun, Dinesh)"
                    placeholderTextColor={Colors.textMuted}
                    value={memberInput}
                    onChangeText={setMemberInput}
                    onSubmitEditing={handleAddMember}
                  />
                  <TouchableOpacity style={styles.addMemberBtn} onPress={handleAddMember}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.addMemberBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Members chips */}
                <View style={styles.membersChipWrap}>
                  {members.map((m, idx) => (
                    <View key={idx} style={styles.memberChip}>
                      <Ionicons name="person-circle-outline" size={14} color="#A855F7" />
                      <Text style={styles.memberChipText}>{m}</Text>
                      {members.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveMember(idx)}>
                          <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Initial Pool Contribution per member */}
                <Text style={styles.fieldLabel}>Initial Pool Fund Per Member (Optional ₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 3000 (Collects ₹3,000 from each member)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={initialContribution}
                  onChangeText={setInitialContribution}
                />
                {parseFloat(initialContribution) > 0 && (
                  <Text style={styles.poolPreviewText}>
                    Total Starting Pool Fund: ₹
                    {(parseFloat(initialContribution) * members.length).toLocaleString('en-IN')} (from {members.length} members)
                  </Text>
                )}
              </>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name={tripType === 'solo' ? 'person' : 'airplane'} size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {tripType === 'solo' ? 'Create Solo Trip' : 'Create Group Trip & Start Logging'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#11131B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeSelectorRow: {
    gap: 8,
    marginBottom: 6,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: '#38BDF8',
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  typeButtonTitleActive: {
    color: '#FFFFFF',
  },
  typeButtonSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  soloHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: Radii.lg,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  soloHintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 3,
  },
  soloHintDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  templateChipText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 6,
  },
  memberInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addMemberBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    gap: 4,
  },
  addMemberBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  membersChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  memberChipText: {
    fontSize: 12,
    color: '#D8B4FE',
    fontWeight: '600',
  },
  poolPreviewText: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
