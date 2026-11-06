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
import { useTamilCalendarStore, CalendarViewMode } from '../state/tamil-calendar-store';
import { MonthDayItem } from '../services/tamil-calendar-service';

const WEEKDAYS_TAMIL = [
  { short: 'ஞா', full: 'ஞாயிறு', isSunday: true },
  { short: 'தி', full: 'திங்கள்' },
  { short: 'செ', full: 'செவ்வாய்' },
  { short: 'பு', full: 'புதன்' },
  { short: 'வி', full: 'வியாழன்' },
  { short: 'வெ', full: 'வெள்ளி' },
  { short: 'ச', full: 'சனி' },
];

export const TamilCalendarSheetModal: React.FC = () => {
  const isOpen = useTamilCalendarStore((s) => s.isOpen);
  const closeModal = useTamilCalendarStore((s) => s.closeModal);
  const viewMode = useTamilCalendarStore((s) => s.viewMode);
  const setViewMode = useTamilCalendarStore((s) => s.setViewMode);

  const selectedDate = useTamilCalendarStore((s) => s.selectedDate);
  const data = useTamilCalendarStore((s) => s.calendarData);
  const monthData = useTamilCalendarStore((s) => s.monthCalendarData);

  const nextDay = useTamilCalendarStore((s) => s.nextDay);
  const prevDay = useTamilCalendarStore((s) => s.prevDay);
  const nextMonth = useTamilCalendarStore((s) => s.nextMonth);
  const prevMonth = useTamilCalendarStore((s) => s.prevMonth);
  const jumpToToday = useTamilCalendarStore((s) => s.jumpToToday);
  const selectDateFromMonth = useTamilCalendarStore((s) => s.selectDateFromMonth);

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

  const handlePrevDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    prevDay();
  };

  const handleNextDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    nextDay();
  };

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    prevMonth();
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    nextMonth();
  };

  const handleToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    jumpToToday();
  };

  const handleSelectDay = (dayItem: MonthDayItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    selectDateFromMonth(dayItem.date, false);
  };

  const handleSwitchToDailyForSelected = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setViewMode('daily');
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
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  தமிழ் நாள்காட்டி & பஞ்சாங்கம்
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {viewMode === 'daily' ? 'தினசரி நாள்காட்டி (Daily Sheet)' : 'மாதக் காட்டி (Monthly View)'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeModal}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* View Mode Switcher (Daily vs Month View) */}
          <View style={styles.viewModeSwitcherWrap}>
            <View style={styles.viewModeSwitcher}>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'daily' && styles.viewModeBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setViewMode('daily');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="today-outline"
                  size={14}
                  color={viewMode === 'daily' ? Colors.gold : Colors.textMuted}
                />
                <Text
                  style={[styles.viewModeText, viewMode === 'daily' && styles.viewModeTextActive]}
                  numberOfLines={1}
                >
                  தினசரி (Daily)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === 'month' && styles.viewModeBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setViewMode('month');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={viewMode === 'month' ? Colors.gold : Colors.textMuted}
                />
                <Text
                  style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}
                  numberOfLines={1}
                >
                  மாதக் காட்டி (Month)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ========================================================= */}
          {/* DAILY VIEW MODE */}
          {/* ========================================================= */}
          {viewMode === 'daily' && (
            <>
              {/* Date Selector Navigation (< Today >) */}
              <View style={styles.dateSelectorRow}>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevDay}>
                  <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
                  <Text style={styles.navArrowText}>முந்தைய நாள்</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
                  <Text style={styles.todayBtnText}>இன்று</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextDay}>
                  <Text style={styles.navArrowText}>அடுத்த நாள்</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Switch to Month Pill */}
                <TouchableOpacity
                  style={styles.switchPillBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setViewMode('month');
                  }}
                >
                  <Ionicons name="grid-outline" size={14} color={Colors.gold} />
                  <Text style={styles.switchPillText}>
                    இந்த மாதக் காட்சியை முழுமையாகப் பார்க்க (Month Grid) ➔
                  </Text>
                </TouchableOpacity>

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
                          <Text style={styles.muhurthamSub}>
                            திருமணம், கிரகப்பிரவேசம் மற்றும் சுபகாரியங்களுக்கு உகந்தது
                          </Text>
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
            </>
          )}

          {/* ========================================================= */}
          {/* MONTH VIEW MODE (மாதக் காட்டி) */}
          {/* ========================================================= */}
          {viewMode === 'month' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Month Navigator Header */}
              <View style={styles.monthHeaderRow}>
                <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
                  <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.monthTitleBlock}>
                  <Text style={styles.monthEnglishText}>{monthData.englishMonthName}</Text>
                  <View style={styles.monthTamilPill}>
                    <Text style={styles.monthTamilText}>✨ {monthData.tamilMonthNames}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Jump Today Pill in Month View */}
              <View style={styles.monthTodayRow}>
                <TouchableOpacity style={styles.monthTodayBtn} onPress={handleToday}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.gold} />
                  <Text style={styles.monthTodayBtnText}>இன்றைய நாளுக்குச் செல் (Today)</Text>
                </TouchableOpacity>
              </View>

              {/* Month Grid Card */}
              <View style={styles.monthGridCard}>
                {/* 7 Days of Week Header */}
                <View style={styles.weekdayHeaderRow}>
                  {WEEKDAYS_TAMIL.map((w, idx) => (
                    <View key={idx} style={styles.weekdayCol}>
                      <Text
                        style={[
                          styles.weekdayColText,
                          w.isSunday && { color: '#F87171', fontWeight: '800' },
                        ]}
                      >
                        {w.short}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Day Cells Grid */}
                <View style={styles.daysGridWrap}>
                  {monthData.days.map((item, index) => {
                    const isSelected =
                      selectedDate.getFullYear() === item.date.getFullYear() &&
                      selectedDate.getMonth() === item.date.getMonth() &&
                      selectedDate.getDate() === item.date.getDate();

                    const isMuhurtham = item.dailyData.isSubhaMuhurtham;
                    const hasFestival = item.dailyData.festivals.length > 0;
                    const hasViratham = item.dailyData.virathams.length > 0;
                    const isPournami = item.dailyData.virathams.some((v) => v.includes('பௌர்ணமி'));
                    const isAmavasai = item.dailyData.virathams.some((v) => v.includes('அமாவாசை'));

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          !item.isCurrentMonth && styles.dayCellDimmed,
                          item.isToday && styles.dayCellToday,
                          isSelected && styles.dayCellSelected,
                          isMuhurtham && item.isCurrentMonth && styles.dayCellMuhurtham,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectDay(item)}
                      >
                        {/* English Day Number */}
                        <Text
                          style={[
                            styles.dayNumText,
                            !item.isCurrentMonth && styles.dayNumTextDimmed,
                            item.isToday && styles.dayNumTextToday,
                            isSelected && styles.dayNumTextSelected,
                          ]}
                        >
                          {item.dayNumber}
                        </Text>

                        {/* Tamil Day Number */}
                        <Text
                          style={[
                            styles.tamilDaySubText,
                            !item.isCurrentMonth && styles.tamilDaySubTextDimmed,
                            isSelected && { color: '#FDE68A' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.dailyData.tamilDate.tamilDay}
                        </Text>

                        {/* Indicator Icons / Dots */}
                        <View style={styles.cellBadgeRow}>
                          {isMuhurtham && item.isCurrentMonth && (
                            <Text style={styles.muhurthamStarIcon}>🌟</Text>
                          )}
                          {isPournami && item.isCurrentMonth && (
                            <Text style={styles.thithiIcon}>🌕</Text>
                          )}
                          {isAmavasai && item.isCurrentMonth && (
                            <Text style={styles.thithiIcon}>🌑</Text>
                          )}
                          {(hasFestival || hasViratham) &&
                            !isPournami &&
                            !isAmavasai &&
                            item.isCurrentMonth && (
                              <View style={styles.virathamDot} />
                            )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Grid Legend */}
                <View style={styles.gridLegendRow}>
                  <View style={styles.legendItem}>
                    <Text style={{ fontSize: 11 }}>🌟</Text>
                    <Text style={styles.legendText}>சுப முகூர்த்தம்</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={{ fontSize: 11 }}>🌕/🌑</Text>
                    <Text style={styles.legendText}>பௌர்ணமி / அமாவாசை</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.virathamDot} />
                    <Text style={styles.legendText}>விரதம் / விசேஷம்</Text>
                  </View>
                </View>
              </View>

              {/* SELECTED DAY SUMMARY INSPECTOR CARD */}
              <View style={styles.selectedDayCard}>
                <View style={styles.selectedDayCardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.selectedDayDate} numberOfLines={2}>
                      {selectedDate.getDate()}{' '}
                      {selectedDate.toLocaleDateString('ta-IN', { month: 'long' })}{' '}
                      {selectedDate.getFullYear()} ({data.tamilDate.weekdayTamil})
                    </Text>
                    <Text style={styles.selectedDayTamil} numberOfLines={1}>
                      ✨ {data.tamilDate.tamilYear} வருடம் • {data.tamilDate.tamilMonth}{' '}
                      {data.tamilDate.tamilDay}-ஆம் நாள்
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.openDailySheetBtn}
                    onPress={handleSwitchToDailyForSelected}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.openDailySheetBtnText}>தினசரி தாள்</Text>
                    <Ionicons name="arrow-forward" size={13} color="#030712" />
                  </TouchableOpacity>
                </View>

                {/* Auspicious Flag Banner */}
                {isSubhaMuhurtham && (
                  <View style={styles.selectedMuhurthamBanner}>
                    <Ionicons name="heart-circle" size={16} color="#10B981" />
                    <Text style={styles.selectedMuhurthamText}>
                      🌟 சுப முகூர்த்த நாள் (திருமணம் & சுபகாரியங்களுக்கு உகந்தது)
                    </Text>
                  </View>
                )}

                {/* Quick Panchangam Row */}
                <View style={styles.selectedPanchangRow}>
                  <View style={styles.selectedPanchangCol}>
                    <Text style={styles.selectedPanchangLabel}>திதி</Text>
                    <Text style={styles.selectedPanchangVal} numberOfLines={1}>
                      {panchangam.thithi} ({panchangam.paksham})
                    </Text>
                  </View>
                  <View style={styles.selectedPanchangDivider} />
                  <View style={styles.selectedPanchangCol}>
                    <Text style={styles.selectedPanchangLabel}>நட்சத்திரம்</Text>
                    <Text style={styles.selectedPanchangVal} numberOfLines={1}>
                      {panchangam.nakshatram}
                    </Text>
                  </View>
                  <View style={styles.selectedPanchangDivider} />
                  <View style={styles.selectedPanchangCol}>
                    <Text style={styles.selectedPanchangLabel}>நல்ல நேரம்</Text>
                    <Text style={[styles.selectedPanchangVal, { color: '#34D399' }]} numberOfLines={1}>
                      {auspiciousTimes.nallaNeramMorning.start} - {auspiciousTimes.nallaNeramMorning.end}
                    </Text>
                  </View>
                </View>

                {/* Festivals & Virathams on Selected Day */}
                {(festivals.length > 0 || virathams.length > 0) && (
                  <View style={styles.selectedEventsRow}>
                    {festivals.map((f, i) => (
                      <View key={`f-${i}`} style={styles.eventChip}>
                        <Text style={styles.eventChipIcon}>🎉</Text>
                        <Text style={styles.eventChipText}>{f}</Text>
                      </View>
                    ))}
                    {virathams.map((v, i) => (
                      <View key={`v-${i}`} style={styles.virathamChip}>
                        <Text style={styles.eventChipIcon}>🪔</Text>
                        <Text style={styles.eventChipText}>{v}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* MONTH SUBHA MUHURTHAM DAYS LIST */}
              {monthData.subhaMuhurthamDays.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="heart-circle" size={16} color={Colors.gold} />
                    <Text style={styles.sectionHeaderTitle}>
                      💍 இந்த மாத சுப முகூர்த்த நாட்கள் ({monthData.subhaMuhurthamDays.length})
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muhurthamChipsScroll}>
                    {monthData.subhaMuhurthamDays.map((mDay, i) => {
                      const isSel =
                        selectedDate.getDate() === mDay.date.getDate() &&
                        selectedDate.getMonth() === mDay.date.getMonth();
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.muhurthamDateCard, isSel && styles.muhurthamDateCardActive]}
                          onPress={() => handleSelectDay(mDay)}
                        >
                          <Text style={styles.muhurthamDayNum}>{mDay.dayNumber}</Text>
                          <Text style={styles.muhurthamTamilDay}>
                            {mDay.dailyData.tamilDate.tamilMonth} {mDay.dailyData.tamilDate.tamilDay}
                          </Text>
                          <Text style={styles.muhurthamWeekday}>
                            {mDay.dailyData.tamilDate.weekdayTamil.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* MONTH FESTIVALS & VIRATHAMS LIST */}
              {monthData.festivalsAndVirathams.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="sparkles" size={15} color={Colors.cyan} />
                    <Text style={styles.sectionHeaderTitle}>
                      🪔 இந்த மாத முக்கிய விசேஷங்கள் & விரதங்கள்
                    </Text>
                  </View>

                  <View style={styles.monthEventsList}>
                    {monthData.festivalsAndVirathams.map((evt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.monthEventItem}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          selectDateFromMonth(evt.date, false);
                        }}
                      >
                        <View style={styles.monthEventDateBadge}>
                          <Text style={styles.monthEventDayText}>{evt.day}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.monthEventName}>{evt.name}</Text>
                          <Text style={styles.monthEventSub}>
                            {evt.date.toLocaleDateString('ta-IN', { weekday: 'long' })}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color="#64748B" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
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
    fontSize: 16,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* View Mode Switcher */
  viewModeSwitcherWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#141419',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  viewModeBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  viewModeTextActive: {
    color: Colors.gold,
    fontWeight: '800',
  },

  /* Daily View Controls */
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
  switchPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  switchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 60 : 56,
  },

  /* TRADITIONAL CALENDAR SHEET CARD */
  calendarSheet: {
    backgroundColor: '#18181D',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  sheetTopRibbon: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  yearNameText: {
    fontSize: 12,
    fontWeight: '800',
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  englishDateBlock: {
    flex: 1,
    alignItems: 'center',
  },
  englishDayNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  englishMonthText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateHeroDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tamilDateBlock: {
    flex: 1,
    alignItems: 'center',
  },
  tamilDayNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: -1,
  },
  tamilMonthText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    marginTop: 2,
  },
  weekdayBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weekdayBannerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
  },
  sunTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sunLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sunValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* SECTION WRAPPER */
  sectionWrap: {
    marginTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  muhurthamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  muhurthamTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
  },
  muhurthamSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 6,
  },
  festivalIcon: {
    fontSize: 16,
  },
  festivalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
    flex: 1,
  },
  virathamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 6,
  },
  virathamIcon: {
    fontSize: 16,
  },
  virathamText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C7D2FE',
    flex: 1,
  },

  /* 4-BOX PANCHANGAM GRID */
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radii.md,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
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
    marginTop: 3,
  },
  yogaBadgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  yogaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  yogaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* TIMINGS */
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
    marginBottom: 8,
  },
  timingHeaderTitleEmerald: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
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
    marginBottom: 8,
  },
  timingHeaderTitleRose: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F87171',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  timingItemValueRose: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
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

  /* ========================================================= */
  /* MONTH VIEW STYLES */
  /* ========================================================= */
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleBlock: {
    alignItems: 'center',
  },
  monthEnglishText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  monthTamilPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  monthTamilText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
  },
  monthTodayRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthTodayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  monthGridCard: {
    backgroundColor: '#16161C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 10,
    marginBottom: 16,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
    marginBottom: 6,
  },
  weekdayCol: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekdayColText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  daysGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellDimmed: {
    opacity: 0.25,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  dayCellSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
    borderWidth: 1.5,
    borderColor: '#FBBF24',
  },
  dayCellMuhurtham: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dayNumTextDimmed: {
    color: Colors.textMuted,
  },
  dayNumTextToday: {
    color: Colors.gold,
    fontWeight: '900',
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tamilDaySubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: -1,
  },
  tamilDaySubTextDimmed: {
    color: '#78350F',
  },
  cellBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    height: 10,
    marginTop: 1,
  },
  muhurthamStarIcon: {
    fontSize: 8,
  },
  thithiIcon: {
    fontSize: 8,
  },
  virathamDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  gridLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  /* Selected Day Inspector Card */
  selectedDayCard: {
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    marginBottom: 16,
  },
  selectedDayCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectedDayDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  selectedDayTamil: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: 2,
  },
  openDailySheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openDailySheetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#030712',
  },
  selectedMuhurthamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 10,
  },
  selectedMuhurthamText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    flex: 1,
  },
  selectedPanchangRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  selectedPanchangCol: {
    flex: 1,
    alignItems: 'center',
  },
  selectedPanchangDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedPanchangLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedPanchangVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  selectedEventsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  virathamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventChipIcon: {
    fontSize: 11,
  },
  eventChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  /* Month Muhurtham Scroll */
  muhurthamChipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  muhurthamDateCard: {
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 64,
  },
  muhurthamDateCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  muhurthamDayNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#34D399',
  },
  muhurthamTamilDay: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: 2,
  },
  muhurthamWeekday: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 1,
  },

  /* Month Events List */
  monthEventsList: {
    backgroundColor: '#1E1E26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  monthEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  monthEventDateBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthEventDayText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.gold,
  },
  monthEventName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  monthEventSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
