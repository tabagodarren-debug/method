import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Pressable,
  Animated, PanResponder, Dimensions, Easing,
} from 'react-native';

const WINDOW_HEIGHT = Dimensions.get('window').height;
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { purchaseAppUnlock, restoreAppUnlock, APP_PLUS_PRICE, getAppPlusPrice } from '../services/purchases';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { capture } from '../services/analytics';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
};

const VALUE_PROPS = [
  { icon: 'star-outline' as const,           label: 'Unlock all premium features' },
  { icon: 'infinite-outline' as const,       label: 'One-time purchase — yours forever' },
  { icon: 'shield-checkmark-outline' as const, label: 'No subscription, no hidden fees' },
];

export default function PaywallModal({ visible, onClose, onPurchaseComplete }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [price, setPrice] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 4,
      onPanResponderMove: (_, { dy }) => { if (dy > 0) translateY.setValue(dy); },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 100 || vy > 0.8) {
          Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true })
            .start(() => { onClose(); });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, overshootClamping: true, tension: 80, friction: 14 }).start();
        }
      },
    })
  ).current;

  const handleDismiss = () => {
    Animated.timing(translateY, { toValue: WINDOW_HEIGHT, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => onClose());
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(WINDOW_HEIGHT);
      Animated.timing(translateY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      capture('paywall_shown');
      getAppPlusPrice().then(setPrice);
    }
  }, [visible]);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await purchaseAppUnlock();
      if (result.success) {
        capture('paywall_purchased');
        onClose();
        onPurchaseComplete();
      } else if (!result.cancelled && result.error) {
        Alert.alert('Purchase failed', result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restoreAppUnlock();
      if (success) {
        Alert.alert('Restored', 'Your purchase has been restored!');
        onPurchaseComplete();
      } else {
        Alert.alert('Not found', 'No previous purchase found on this account.');
      }
    } finally {
      setRestoring(false);
    }
  };

  const isBusy = loading || restoring;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <BlurView tint="systemUltraThinMaterialDark" intensity={30} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.appIconCircle}>
            <Ionicons name="star" size={36} color={theme.primary} />
          </View>
          <Text style={styles.heroHeadline}>AppName Plus</Text>
          <Text style={styles.heroSubhead}>
            Unlock everything — one-time purchase, no subscription.
          </Text>
        </View>

        {/* Value props */}
        <View style={styles.valueSection}>
          {VALUE_PROPS.map((item, i) => (
            <View key={i} style={styles.valuePropRow}>
              <View style={styles.valuePropIcon}>
                <Ionicons name={item.icon} size={18} color={theme.primary} />
              </View>
              <Text style={styles.valuePropLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Price + CTA */}
        <View style={styles.ctaSection}>
          {price === null
            ? <ActivityIndicator color={theme.primary} style={{ marginVertical: 10 }} />
            : <Text style={styles.price}>{price}</Text>
          }
          <Text style={styles.priceNote}>one-time · no subscription</Text>

          <TouchableOpacity
            style={[styles.ctaButton, (isBusy || price === null) && styles.ctaButtonDisabled]}
            onPress={handlePurchase}
            disabled={isBusy || price === null}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.ctaButtonText}>Unlock AppName Plus</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} disabled={isBusy} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator color={theme.textMuted} size="small" />
              : <Text style={styles.restoreText}>Restore Purchase</Text>
            }
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1 },
    handleArea: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(128,128,128,0.25)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      backgroundColor: theme.backgroundAlt,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      paddingBottom: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 24,
    },
    hero: {
      paddingTop: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    appIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    heroHeadline: {
      color: theme.textPrimary, fontSize: 22, fontWeight: '800',
      textAlign: 'center', lineHeight: 28, letterSpacing: -0.4,
    },
    heroSubhead: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    valueSection: { paddingHorizontal: 24, paddingVertical: 16 },
    valuePropRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    valuePropIcon: {
      width: 32, height: 32, borderRadius: 9,
      backgroundColor: theme.primary + '1A',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    valuePropLabel: { flex: 1, fontSize: 14, color: theme.textPrimary, lineHeight: 20, fontWeight: '500' },
    ctaSection: { paddingHorizontal: 24, alignItems: 'center' },
    price: { fontSize: 38, fontWeight: '900', color: theme.primary, letterSpacing: -1 },
    priceNote: { fontSize: 12, color: theme.textMuted, marginTop: 2, marginBottom: 16 },
    ctaButton: {
      width: '100%', backgroundColor: theme.primary,
      borderRadius: 100, paddingVertical: 16,
      alignItems: 'center', justifyContent: 'center', minHeight: 50,
    },
    ctaButtonDisabled: { opacity: 0.6 },
    ctaButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    restoreBtn: { marginTop: 12, paddingVertical: 6, alignItems: 'center' },
    restoreText: { fontSize: 13, color: theme.textMuted },
  });
}
