// Site types that can be surveyed
export const SITE_TYPES = [
  "pond",
  "hedgerow",
  "meadow",
  "river",
  "woodland",
  "verge",
] as const;
export type SiteType = (typeof SITE_TYPES)[number];

// Site data source
export const SITE_SOURCES = ["seeded", "user_suggested", "verified"] as const;
export type SiteSource = (typeof SITE_SOURCES)[number];

// User status
export const USER_STATUSES = ["active", "suspended", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Token ledger entry types
export const TOKEN_TYPES = [
  "survey_reward",
  "streak_bonus",
  "referral_bonus",
  "ad_bonus",
  "withdrawal",
  "adjustment",
] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

// Token reference types
export const TOKEN_REFERENCE_TYPES = [
  "survey",
  "referral",
  "withdrawal",
  "admin",
] as const;
export type TokenReferenceType = (typeof TOKEN_REFERENCE_TYPES)[number];

// Monthly pool status
export const POOL_STATUSES = ["accruing", "calculated", "paid_out"] as const;
export type PoolStatus = (typeof POOL_STATUSES)[number];

// Notification categories
export const NOTIFICATION_CATEGORIES = [
  "site_health",
  "streak",
  "earnings",
  "community",
  "referral",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

// Return visit multiplier tiers
export const VISIT_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  3: 1.5,
  5: 2.0,
  10: 3.0,
  20: 5.0,
};

// Base tokens per survey
export const BASE_SURVEY_TOKENS = 3;
export const FIRST_SURVEY_BONUS = 5;
export const WEEKLY_STREAK_BONUS = 3;
export const REFERRAL_BONUS = 1;
export const NEW_USER_REFERRAL_WELCOME = 5;

// Anti-gaming limits
export const MAX_SURVEYS_PER_DAY = 8;
export const SAME_SITE_COOLDOWN_DAYS = 5;
export const MIN_TIME_AT_SITE_SECONDS = 120;
export const GPS_PROXIMITY_THRESHOLD_M = 20;
export const GPS_ACCURACY_MAX_M = 30;
export const PHOTO_GPS_MAX_DEVIATION_M = 50;

// Withdrawal
export const MIN_WITHDRAWAL_GBP = 5.0;
export const MIN_SURVEYS_FOR_WITHDRAWAL = 10;
export const PLATFORM_REVENUE_SHARE = 0.3;
export const USER_REVENUE_SHARE = 0.7;

// Notifications
export const MAX_NOTIFICATIONS_PER_WEEK = 3;
export const DEFAULT_QUIET_HOURS_START = "21:00";
export const DEFAULT_QUIET_HOURS_END = "08:00";

// Reputation
export const QUALITY_BONUS_THRESHOLD = 0.85;
export const QUALITY_BONUS_MULTIPLIER = 1.5;
export const SUSPENSION_THRESHOLD = 0.4;
