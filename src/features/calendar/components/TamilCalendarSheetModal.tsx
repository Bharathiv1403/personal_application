import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useTamilCalendarStore } from '../state/tamil-calendar-store';

export const TamilCalendarSheetModal: React.FC = () => {
  const isOpen = useTamilCalendarStore((s) => s.isOpen);
  const closeModal = useTamilCalendarStore((s) => s.closeModal);
  const data = useTamilCalendarStore((s) => s.calendarData);
  const nextDay = useTamilCalendarStore((s) => s.nextDay);
  const prevDay = useTamilCalendarStore((s) => s.prevDay);
  const jumpToToday = useTamilCalendarStore((s) => s.jumpToToday);

  if (!isOpen || !data) return null;

  const {
    gregorianDate,
    tamilDate,
    panchangam,
    auspiciousTimes,
    inauspiciousTimes,
    virathams,
    festivals,
    isSubhaMuhurtham,
    thirukkural,
  } = data;

  const englishMonthYear = gregorianDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const englishDay = gregorianDate.getDate();

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    prevDay();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    nextDay();
  };

  const handleToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    jumpToToday();
  };

  const isYogaGood = panchangam.auspiciousYogam !== 'மரண யோகம்';

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top Bar Navigation */}
          <View style={styles.topNav}>
            <View style={styles.navTitleRow}>
              <View style={styles.omIconBadge}>
                <Text style={styles.omText}>🕉️</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>தினசரி நாள்காட்டி</Text>
                <Text style={styles.headerSubtitle}>Tamil Panchangam & Daily Sheet</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Date Selector Navigation (< Today >) */}
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrev}>
              <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
              <Text style={styles.navArrowText}>முந்தைய நாள்</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
              <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
              <Text style={styles.todayBtnText}>இன்று</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navArrowBtn} onPress={handleNext}>
              <Text style={styles.navArrowText}>அடுத்த நாள்</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* TRADITIONAL CALENDAR SHEET CARD */}
            <View style={styles.calendarSheet}>
              {/* Sheet Top Border Ribbon */}
              <View style={styles.sheetTopRibbon}>
                <Text style={styles.yearNameText}>
                  ✨ {tamilDate.tamilYear} வருடம் ({tamilDate.tamilYearEnglish})
                </Text>
                <Text style={styles.ayanaText}>
                  {tamilDate.ayanaTamil.split(' ')[0]} • {tamilDate.ruthuTamil.split(' ')[0]}
                </Text>
              </View>

              {/* Big Date Showcase */}
              <View style={styles.dateHeroContainer}>
                {/* English Date */}
                <View style={styles.englishDateBlock}>
                  <Text style={styles.englishDayNumber}>{englishDay}</Text>
                  <Text style={styles.englishMonthText}>{englishMonthYear}</Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.dateHeroDivider} />

                {/* Tamil Date */}
                <View style={styles.tamilDateBlock}>
                  <Text style={styles.tamilDayNumber}>{tamilDate.tamilDay}</Text>
                  <Text style={styles.tamilMonthText}>
                    {tamilDate.tamilMonth} மாதம்
                  </Text>
                </View>
              </View>

              {/* Weekday Banner */}
              <View style={styles.weekdayBanner}>
                <Ionicons name="sunny" size={16} color="#78350F" />
                <Text style={styles.weekdayBannerText}>
                  {tamilDate.weekdayTamil} ({tamilDate.weekdayEnglish})
                </Text>
              </View>

              {/* Sun Times Bar */}
              <View style={styles.sunTimesRow}>
                <View style={styles.sunItem}>
                  <Ionicons name="sunny-outline" size={14} color={Colors.gold} />
                  <Text style={styles.sunLabel}>உதயம்: </Text>
                  <Text style={styles.sunValue}>{panchangam.sunrise}</Text>
                </View>
                <View style={styles.sunItem}>
                  <Ionicons name="moon-outline" size={14} color="#A78BFA" />
                  <Text style={styles.sunLabel}>அஸ்தமனம்: </Text>
                  <Text style={styles.sunValue}>{panchangam.sunset}</Text>
                </View>
              </View>
            </View>

            {/* VIRATHAM & FESTIVAL HIGHLIGHTS */}
            {(festivals.length > 0 || virathams.length > 0 || isSubhaMuhurtham) && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="sparkles" size={15} color={Colors.gold} />
                  <Text style={styles.sectionHeaderTitle}>இன்றைய விசேஷங்கள் & விரதங்கள்</Text>
                </View>

                {isSubhaMuhurtham && (
                  <View style={styles.muhurthamBanner}>
                    <Ionicons name="heart-circle" size={18} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.muhurthamTitle}>சுப முகூர்த்த நாள் 💍</Text>
                      <Text style={styles.muhurthamSub}>திருமணம், கிரகப்பிரவேசம் மற்றும் சுபகாரியங்களுக்கு உகந்தது</Text>
                    </View>
                  </View>
                )}

                {festivals.map((fest, idx) => (
                  <View key={`fest-${idx}`} style={styles.festivalCard}>
                    <Text style={styles.festivalIcon}>🎉</Text>
                    <Text style={styles.festivalText}>{fest}</Text>
                  </View>
                ))}

                {virathams.map((viratham, idx) => (
                  <View key={`vir-${idx}`} style={styles.virathamCard}>
                    <Text style={styles.virathamIcon}>🪔</Text>
                    <Text style={styles.virathamText}>{viratham}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* PANCHANGAM 4-BOX GRID */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="planet-outline" size={15} color={Colors.cyan} />
                <Text style={styles.sectionHeaderTitle}>பஞ்சாங்கம் (Daily Panchangam)</Text>
              </View>

              <View style={styles.grid2x2}>
                {/* Thithi */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>திதி ({panchangam.paksham})</Text>
                  <Text style={styles.gridValue}>{panchangam.thithi}</Text>
                  <Text style={styles.gridSub}>{panchangam.thithiEnglish}</Text>
                </View>

                {/* Nakshatram */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>நட்சத்திரம்</Text>
                  <Text style={styles.gridValue}>{panchangam.nakshatram}</Text>
                  <Text style={styles.gridSub}>{panchangam.nakshatramEnglish}</Text>
                </View>

                {/* Yogam */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>யோகம்</Text>
                  <View style={styles.yogaBadgeRow}>
                    <View
                      style={[
                        styles.yogaBadge,
                        {
                          backgroundColor: isYogaGood
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          borderColor: isYogaGood ? Colors.primary : Colors.danger,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.yogaBadgeText,
                          { color: isYogaGood ? Colors.primary : Colors.danger },
                        ]}
                      >
                        {panchangam.auspiciousYogam}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.gridSub}>நித்யம்: {panchangam.nithyaYogam}</Text>
                </View>

                {/* Karanam */}
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>கரணம்</Text>
                  <Text style={styles.gridValue}>{panchangam.karanam}</Text>
                  <Text style={styles.gridSub}>சந்திர ராசி: {panchangam.moonRasi.split(' ')[0]}</Text>
                </View>
              </View>
            </View>

            {/* AUSPICIOUS & INAUSPICIOUS TIMINGS */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="time-outline" size={15} color={Colors.gold} />
                <Text style={styles.sectionHeaderTitle}>நேரக் கணிப்புகள் (Timings)</Text>
              </View>

              {/* Subha Neram Card */}
              <View style={styles.timingCardEmerald}>
                <View style={styles.timingHeaderEmerald}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.timingHeaderTitleEmerald}>சுப நேரங்கள் (Auspicious)</Text>
                </View>
                <View style={styles.timingRow}>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>நல்ல நேரம் (காலை)</Text>
                    <Text style={styles.timingItemValueEmerald}>
                      {auspiciousTimes.nallaNeramMorning.start} - {auspiciousTimes.nallaNeramMorning.end}
                    </Text>
                  </View>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>நல்ல நேரம் (மாலை)</Text>
                    <Text style={styles.timingItemValueEmerald}>
                      {auspiciousTimes.nallaNeramEvening.start} - {auspiciousTimes.nallaNeramEvening.end}
                    </Text>
                  </View>
                </View>
                <View style={[styles.timingRow, { marginTop: 8 }]}>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>கௌரி நல்ல நேரம் (காலை)</Text>
                    <Text style={styles.timingItemValueEmerald}>
                      {auspiciousTimes.gowriNallaNeramMorning.start} - {auspiciousTimes.gowriNallaNeramMorning.end}
                    </Text>
                  </View>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>கௌரி நல்ல நேரம் (மாலை)</Text>
                    <Text style={styles.timingItemValueEmerald}>
                      {auspiciousTimes.gowriNallaNeramEvening.start} - {auspiciousTimes.gowriNallaNeramEvening.end}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Asubha Neram Card */}
              <View style={styles.timingCardRose}>
                <View style={styles.timingHeaderRose}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.timingHeaderTitleRose}>அசுப நேரங்கள் (Inauspicious)</Text>
                </View>
                <View style={styles.timingRow}>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>ராகு காலம்</Text>
                    <Text style={styles.timingItemValueRose}>
                      {inauspiciousTimes.rahuKaalam.start} - {inauspiciousTimes.rahuKaalam.end}
                    </Text>
                  </View>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>எமகண்டம்</Text>
                    <Text style={styles.timingItemValueRose}>
                      {inauspiciousTimes.yamagandam.start} - {inauspiciousTimes.yamagandam.end}
                    </Text>
                  </View>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingItemLabel}>குளிகை</Text>
                    <Text style={styles.timingItemValueRose}>
                      {inauspiciousTimes.kuligai.start} - {inauspiciousTimes.kuligai.end}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SOOLAM & CHANDRASHTAMAM */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="compass-outline" size={15} color="#A78BFA" />
                <Text style={styles.sectionHeaderTitle}>திசை சூலம் & சந்திராஷ்டமம்</Text>
              </View>

              <View style={styles.infoRowCards}>
                {/* Soolam */}
                <View style={styles.infoBox}>
                  <View style={styles.infoBoxHeader}>
                    <Ionicons name="navigate" size={14} color={Colors.gold} />
                    <Text style={styles.infoBoxTitle}>திசை சூலம்</Text>
                  </View>
                  <Text style={styles.infoBoxBigVal}>{panchangam.soolamDirection}</Text>
                  <Text style={styles.infoBoxSub}>பரிகாரம்: {panchangam.soolamParigaram}</Text>
                </View>

                {/* Chandrashtamam */}
                <View style={styles.infoBox}>
                  <View style={styles.infoBoxHeader}>
                    <Ionicons name="warning-outline" size={14} color="#F87171" />
                    <Text style={styles.infoBoxTitle}>சந்திராஷ்டமம்</Text>
                  </View>
                  <Text style={[styles.infoBoxBigVal, { color: '#F87171' }]}>
                    {panchangam.chandrashtamaRasi.split(' ')[0]}
                  </Text>
                  <Text style={styles.infoBoxSub}>சுப காரியங்களைத் தவிர்ப்பது நன்று</Text>
                </View>
              </View>
            </View>

            {/* DAILY THIRUKKURAL */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="book-outline" size={15} color={Colors.gold} />
                <Text style={styles.sectionHeaderTitle}>இன்றைய திருக்குறள் & உரை</Text>
              </View>

              <View style={styles.kuralCard}>
                <View style={styles.kuralBadgeRow}>
                  <Text style={styles.kuralBadgeText}>
                    குறள் {thirukkural.number} • {thirukkural.adhigaram} ({thirukkural.adhigaramEnglish})
                  </Text>
                </View>

                <View style={styles.kuralTextContainer}>
                  <Text style={styles.kuralLine}>"{thirukkural.line1}</Text>
                  <Text style={styles.kuralLine}>{thirukkural.line2}"</Text>
                </View>

                <View style={styles.kuralDivider} />

                <Text style={styles.kuralMeaningTitle}>பொருள் (Meaning):</Text>
                <Text style={styles.kuralMeaningText}>{thirukkural.meaningTamil}</Text>
                <Text style={styles.kuralEnglishText}>{thirukkural.meaningEnglish}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F0F12',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  omIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  omText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navArrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },

  /* TRADITIONAL CALENDAR SHEET CARD */
  calendarSheet: {
    backgroundColor: '#18181D',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  sheetTopRibbon: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  yearNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
  },
  ayanaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  dateHeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#141418',
  },
  englishDateBlock: {
    alignItems: 'center',
    flex: 1,
  },
  englishDayNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 56,
  },
  englishMonthText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateHeroDivider: {
    width: 1.5,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tamilDateBlock: {
    alignItems: 'center',
    flex: 1,
  },
  tamilDayNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F59E0B',
    lineHeight: 56,
  },
  tamilMonthText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FDE68A',
    marginTop: 2,
  },
  weekdayBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weekdayBannerText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.3,
  },
  sunTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sunLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sunValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* SECTION GENERAL */
  sectionWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: Spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* VIRATHAMS & FESTIVALS */
  muhurthamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  muhurthamTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
  },
  muhurthamSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 1,
  },
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  festivalIcon: {
    fontSize: 18,
  },
  festivalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    flex: 1,
  },
  virathamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  virathamIcon: {
    fontSize: 18,
  },
  virathamText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DDD6FE',
    flex: 1,
  },

  /* 4-BOX PANCHANG GRID */
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridBox: {
    width: '48.4%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radii.md,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  gridSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  yogaBadgeRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  yogaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  yogaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* TIMINGS CARDS */
  timingCardEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 10,
  },
  timingHeaderEmerald: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timingHeaderTitleEmerald: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  timingItem: {
    flex: 1,
  },
  timingItemLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  timingItemValueEmerald: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A7F3D0',
  },

  timingCardRose: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: Radii.md,
    padding: 12,
  },
  timingHeaderRose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  timingHeaderTitleRose: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.danger,
  },
  timingItemValueRose: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FECDD3',
  },

  /* SOOLAM & CHANDRASHTAMAM */
  infoRowCards: {
    flexDirection: 'row',
    gap: 10,
  },
  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radii.md,
    padding: 12,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  infoBoxBigVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  infoBoxSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  /* THIRUKKURAL CARD */
  kuralCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: Radii.md,
    padding: 14,
  },
  kuralBadgeRow: {
    marginBottom: 8,
  },
  kuralBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
  },
  kuralTextContainer: {
    marginVertical: 4,
  },
  kuralLine: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  kuralDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 10,
  },
  kuralMeaningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  kuralMeaningText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  kuralEnglishText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

