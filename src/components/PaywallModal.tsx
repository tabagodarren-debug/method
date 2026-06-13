import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { purchaseAppUnlock, restoreAppUnlock, getAppPlusPrice } from '../services/purchases';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

const FEATURES = [
  {
    icon: 'timer-outline' as const,
    title: 'Custom focus intervals',
    sub: 'Train in sessions from 5 to 180 minutes. Longer sessions, more Merit$.',
  },
  {
    icon: 'shield' as const,
    title: 'Streak Shield',
    sub: 'Miss a day and your streak stays intact. One shield, refills every 7 days.',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Merit analytics',
    sub: 'See your best days, streaks, earned Merit$, and focus patterns.',
  },
  {
    icon: 'flash-outline' as const,
    title: 'Everything that ships next',
    sub: 'Soundscapes, widgets, and all future Pro features. No extra charge.',
  },
];

export default function PaywallModal({ visible, onClose, onUnlocked }: Props) {
  const insets = useSafeAreaInsets();
  const [price, setPrice] = useState('$2.99');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const backdropOp = useSharedValue(0);
  const contentOp  = useSharedValue(0);
  const contentTy  = useSharedValue(32);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      getAppPlusPrice().then(setPrice);
      backdropOp.value = withTiming(1, { duration: 300 });
      contentOp.value  = withDelay(60, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
      contentTy.value  = withDelay(60, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    }
  }, [visible]);

  const dismiss = () => {
    backdropOp.value = withTiming(0, { duration: 280 });
    contentOp.value  = withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) runOnJS(finishClose)();
    });
    contentTy.value  = withTiming(32, { duration: 260, easing: Easing.in(Easing.cubic) });
  };

  const finishClose = () => {
    setModalVisible(false);
    onClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));
  const contentStyle  = useAnimatedStyle(() => ({
    opacity: contentOp.value,
    transform: [{ translateY: contentTy.value }],
  }));

  const handlePurchase = async () => {
    setLoading(true);
    const result = await purchaseAppUnlock();
    setLoading(false);
    if (result.success) {
      onUnlocked();
      dismiss();
    } else if (result.error) {
      Alert.alert('Purchase failed', result.error);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restoreAppUnlock();
    setRestoring(false);
    if (success) {
      onUnlocked();
      dismiss();
    } else {
      Alert.alert('Nothing to restore', 'No previous purchase found for this Apple ID.');
    }
  };

  const isBusy = loading || restoring;

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
      </Animated.View>

      {/* Close button — above all overlays */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 16 }]}
        onPress={dismiss}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={20} color="rgba(255,255,255,0.50)" />
      </TouchableOpacity>

      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}>
        <Animated.View style={[styles.content, contentStyle]}>

          {/* Badge */}
          <View style={styles.badge}>
            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Text style={styles.badgeText}>METHOD PRO</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Stop leaving{'\n'}merit on the table.</Text>
          <Text style={styles.subheadline}>Serious focus deserves serious tools.</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={f.icon} size={17} color={Colors.pureWhite} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Price */}
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.priceNote}>one-time · no subscription</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, isBusy && { opacity: 0.6 }]}
            onPress={handlePurchase}
            activeOpacity={0.86}
            disabled={isBusy}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.08)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.ctaShine} />
            {loading
              ? <ActivityIndicator color={Colors.pureWhite} />
              : <Text style={styles.ctaLabel}>Unlock Method Pro</Text>
            }
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} disabled={isBusy} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size="small" color="rgba(255,255,255,0.28)" />
              : <Text style={styles.restoreLabel}>Restore purchase</Text>
            }
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  closeBtn: {
    position: 'absolute',
    right: 28,
    zIndex: 100,
    padding: 4,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 28,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: Colors.pureWhite,
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 28,
  },
  divider: {
    alignSelf: 'stretch',
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 18,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.pureWhite,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.40)',
    lineHeight: 17,
  },
  priceWrap: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -1.5,
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: 0.3,
  },
  ctaBtn: {
    alignSelf: 'stretch',
    height: 58,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    marginBottom: 14,
  },
  ctaShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: 0.3,
  },
  restoreBtn: { paddingVertical: 8 },
  restoreLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.2,
  },
});
