import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import { getDb } from '../db/schema';

const REVIEW_KEYS = {
  transactionCount: 'review_transactionCount',
  lastPromptDate: 'review_lastPromptDate',
  hasReviewed: 'review_hasReviewed',
  appOpenCount: 'review_appOpenCount',
  lastOpenDate: 'review_lastOpenDate',
} as const;

const ANDROID_PACKAGE = 'com.finhabit';
const IOS_APP_ID = '';

const PROMPT_THRESHOLD_TRANSACTIONS = 5;
const REPROMPT_COOLDOWN_DAYS = 90;
const MIN_APP_OPENS = 3;

const PLAY_STORE_URL = `market://details?id=${ANDROID_PACKAGE}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = IOS_APP_ID
  ? `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`
  : '';

function readSetting(key: string): string | null {
  try {
    const db = getDb();
    const row = db.getFirstSync<{ val: string }>(
      'SELECT val FROM settings WHERE id = ?',
      [key],
    );
    return row?.val ?? null;
  } catch {
    return null;
  }
}

function writeSetting(key: string, value: string): void {
  try {
    const db = getDb();
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      key,
      value,
    ]);
  } catch (e) {
    console.warn('ReviewManager: failed to write setting', key, e);
  }
}

function daysBetween(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function openStoreFallback(): Promise<void> {
  const url =
    Platform.OS === 'android'
      ? PLAY_STORE_URL
      : Platform.OS === 'ios'
        ? APP_STORE_URL
        : '';

  if (!url) return;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else if (Platform.OS === 'android') {
      await Linking.openURL(PLAY_STORE_WEB_URL);
    }
  } catch {
    if (Platform.OS === 'android') {
      Linking.openURL(PLAY_STORE_WEB_URL).catch(() => {});
    }
  }
}

async function triggerReview(): Promise<void> {
  try {
    const hasAction = await StoreReview.hasAction();
    if (hasAction) {
      await StoreReview.requestReview();
    } else {
      await openStoreFallback();
    }
  } catch {
    await openStoreFallback();
  }
}

export class ReviewManager {
  static incrementTransactionCount(): void {
    const current = parseInt(
      readSetting(REVIEW_KEYS.transactionCount) ?? '0',
      10,
    );
    writeSetting(REVIEW_KEYS.transactionCount, String(current + 1));
  }

  static recordAppOpen(): void {
    const appOpens = parseInt(readSetting(REVIEW_KEYS.appOpenCount) ?? '0', 10);
    const today = new Date().toISOString().split('T')[0];
    writeSetting(REVIEW_KEYS.appOpenCount, String(appOpens + 1));
    writeSetting(REVIEW_KEYS.lastOpenDate, today);
  }

  static shouldAutoPrompt(): boolean {
    const hasReviewed = readSetting(REVIEW_KEYS.hasReviewed);
    if (hasReviewed === 'true') return false;

    const appOpens = parseInt(readSetting(REVIEW_KEYS.appOpenCount) ?? '0', 10);
    if (appOpens < MIN_APP_OPENS) return false;

    const txCount = parseInt(
      readSetting(REVIEW_KEYS.transactionCount) ?? '0',
      10,
    );
    if (txCount < PROMPT_THRESHOLD_TRANSACTIONS) return false;

    const lastPrompt = readSetting(REVIEW_KEYS.lastPromptDate);
    if (lastPrompt && daysBetween(lastPrompt) < REPROMPT_COOLDOWN_DAYS) {
      return false;
    }

    return true;
  }

  static async maybeRequestReview(): Promise<void> {
    if (!ReviewManager.shouldAutoPrompt()) return;

    writeSetting(REVIEW_KEYS.lastPromptDate, new Date().toISOString());
    writeSetting(REVIEW_KEYS.hasReviewed, 'true');

    setTimeout(async () => {
      try {
        await triggerReview();
      } catch {
        /* non-blocking */
      }
    }, 1500);
  }

  static async requestReviewManually(): Promise<void> {
    writeSetting(REVIEW_KEYS.lastPromptDate, new Date().toISOString());
    writeSetting(REVIEW_KEYS.hasReviewed, 'true');
    await triggerReview();
  }
}
