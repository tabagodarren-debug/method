import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { hasAppUnlock, setAppUnlocked } from '../storage/settings';

const RC_IOS_KEY = 'YOUR_REVENUECAT_IOS_API_KEY';
const ENTITLEMENT_ID = 'app_unlock';

export const APP_PLUS_PRICE = '$2.99';

export const getAppPlusPrice = async (): Promise<string> => {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    return pkg?.product.priceString ?? APP_PLUS_PRICE;
  } catch {
    return APP_PLUS_PRICE;
  }
};

export const initializePurchases = (): void => {
  if (Platform.OS !== 'ios') return;
  Purchases.configure({ apiKey: RC_IOS_KEY });
};

export const checkAppUnlock = async (): Promise<boolean> => {
  const local = await hasAppUnlock();
  if (local) return true;
  try {
    const info = await Purchases.getCustomerInfo();
    const active = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (active) await setAppUnlocked();
    return active;
  } catch {
    return false;
  }
};

export const purchaseAppUnlock = async (): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    if (!pkg) return { success: false, error: 'Product not available. Please try again later.' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const success = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (success) await setAppUnlocked();
    return { success };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'userCancelled' in e && (e as { userCancelled: boolean }).userCancelled) {
      return { success: false, cancelled: true };
    }
    const msg = e instanceof Error ? e.message : 'Purchase failed';
    return { success: false, error: msg };
  }
};

export const restoreAppUnlock = async (): Promise<boolean> => {
  try {
    const info = await Purchases.restorePurchases();
    const success = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (success) await setAppUnlocked();
    return success;
  } catch {
    return false;
  }
};
