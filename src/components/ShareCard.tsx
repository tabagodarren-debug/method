import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import MeritAmount from './MeritAmount';
import WeekStrip from './WeekStrip';
import { Colors } from '../constants/colors';
import { getRankProgress } from '../utils/ranks';
import type { SessionStats, PersonaData } from '../types';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;

type Props = {
  visible: boolean;
  onClose: () => void;
  stats: SessionStats;
  persona: PersonaData | null;
};

export default function ShareCard({ visible, onClose, stats, persona }: Props) {
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch (_) {}
  };

  const rank = getRankProgress(stats.totalEarned).current;

  const streakLabel = stats.currentStreak > 0
    ? `Day ${stats.currentStreak} Streak`
    : 'Start your streak';

  const totalHours = Math.floor(stats.totalMinutes / 60);
  const remainingMins = stats.totalMinutes % 60;
  const timeLabel = totalHours > 0
    ? `${totalHours}h ${remainingMins}m locked in`
    : `${remainingMins}m locked in`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} tint="dark" style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        {/* Capturable card */}
        <View ref={cardRef} style={styles.card} collapsable={false}>
          <LinearGradient
            colors={['#181818', '#0d0d0d']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.topShine} />

          <View style={styles.cardInner}>
            <View style={styles.header}>
              <Text style={styles.brandLabel}>method.</Text>
              <Text style={styles.tagline}>LOCKED IN</Text>
            </View>

            <View style={styles.identityRow}>
              {persona && (
                <Text style={styles.nameLabel}>{persona.name.toUpperCase()}</Text>
              )}
              {persona && <View style={styles.identityDot} />}
              <Text style={styles.rankLabel}>{rank.title.toUpperCase()}</Text>
            </View>

            <MeritAmount
              amount={stats.totalEarned}
              symbolSize={60}
              textStyle={styles.meritNumber}
              color={Colors.pureWhite}
              style={styles.meritRow}
            />

            <Text style={styles.streakLabel}>{streakLabel}</Text>

            <View style={styles.weekRow}>
              <WeekStrip dailySessions={stats.dailySessions ?? {}} dotSize={10} />
            </View>

            <View style={styles.divider} />

            <Text style={styles.metaLabel}>
              {stats.sessionsCompleted} sessions · {timeLabel}
            </Text>
          </View>
        </View>

        {/* Share button below card */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <Text style={styles.shareBtnLabel}>Share Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    width: CARD_W,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
    zIndex: 1,
  },
  cardInner: {
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLabel: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.60)',
  },
  tagline: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.35)',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  nameLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.4,
    color: 'rgba(255,255,255,0.45)',
  },
  identityDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  rankLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: 'rgba(255,255,255,0.70)',
  },
  meritRow: {
    marginVertical: 4,
  },
  meritNumber: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
    marginBottom: 16,
  },
  weekRow: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.35)',
  },
  shareBtn: {
    width: CARD_W,
    height: 50,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  shareBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.background,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.3,
  },
});
