-- Wild Griffin: Initial Schema
-- Incorporates review fixes: bcrypt for phone hashing, idempotency keys,
-- computed days_since_survey, proper indexes, no stored derived columns

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for crypt() / gen_salt()

-- Enums
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE site_type AS ENUM ('pond', 'hedgerow', 'meadow', 'river', 'woodland', 'verge');
CREATE TYPE site_source AS ENUM ('seeded', 'user_suggested', 'verified');
CREATE TYPE token_type AS ENUM ('survey_reward', 'streak_bonus', 'referral_bonus', 'ad_bonus', 'withdrawal', 'adjustment');
CREATE TYPE token_reference_type AS ENUM ('survey', 'referral', 'withdrawal', 'admin');
CREATE TYPE pool_status AS ENUM ('accruing', 'calculated', 'paid_out');
CREATE TYPE notification_category AS ENUM ('site_health', 'streak', 'earnings', 'community', 'referral');

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Phone hash uses pgcrypto bcrypt (NOT plain SHA-256, which is reversible for phone numbers)
    phone_hash      VARCHAR(72) NOT NULL UNIQUE,
    display_name    VARCHAR(50) NOT NULL,
    level           INTEGER NOT NULL DEFAULT 1,
    xp              INTEGER NOT NULL DEFAULT 0,
    reputation_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    total_surveys   INTEGER NOT NULL DEFAULT 0,
    total_tokens_earned INTEGER NOT NULL DEFAULT 0,
    referral_code   VARCHAR(8) UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    referred_by     UUID REFERENCES users(id),
    probation_until TIMESTAMPTZ,
    notification_prefs JSONB NOT NULL DEFAULT '{"site_health":true,"streak":true,"earnings":true,"community":true,"referral":true}',
    push_token      VARCHAR(255),
    quiet_hours_start TIME NOT NULL DEFAULT '21:00',
    quiet_hours_end   TIME NOT NULL DEFAULT '08:00',
    status          user_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Sites (Survey Points)
-- ============================================================
CREATE TABLE sites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    type            site_type NOT NULL,
    geometry        GEOMETRY(Point, 4326) NOT NULL,
    boundary        GEOMETRY(Polygon, 4326),
    radius_m        INTEGER NOT NULL DEFAULT 20,
    region          VARCHAR(50),
    country_code    CHAR(2) NOT NULL DEFAULT 'GB',
    source          site_source NOT NULL DEFAULT 'seeded',
    total_surveys   INTEGER NOT NULL DEFAULT 0,
    unique_surveyors INTEGER NOT NULL DEFAULT 0,
    quality_score   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    last_surveyed_at TIMESTAMPTZ,
    -- days_since_survey is NOT stored — compute at query time:
    -- CURRENT_DATE - last_surveyed_at::date
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified        BOOLEAN NOT NULL DEFAULT false
);

-- Spatial index for nearby queries (the most-hit query)
CREATE INDEX idx_sites_geometry ON sites USING GIST (geometry);
-- For filtering by type
CREATE INDEX idx_sites_type ON sites (type);
-- For finding unsurveyed sites (notification triggers)
CREATE INDEX idx_sites_last_surveyed ON sites (last_surveyed_at) WHERE last_surveyed_at IS NOT NULL;
-- For region-based queries
CREATE INDEX idx_sites_region ON sites (country_code, region);

-- ============================================================
-- Surveys
-- ============================================================
CREATE TABLE surveys (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id),
    site_id           UUID NOT NULL REFERENCES sites(id),
    -- Idempotency key: client-generated UUID to prevent duplicate submissions from offline sync
    idempotency_key   UUID NOT NULL UNIQUE,
    visit_number      INTEGER NOT NULL,
    photo_url         VARCHAR(255),
    photo_verified    BOOLEAN NOT NULL DEFAULT false,
    answers           JSONB NOT NULL,
    gps_lat           DECIMAL(9,6) NOT NULL,
    gps_lon           DECIMAL(9,6) NOT NULL,
    gps_accuracy_m    DECIMAL(5,1),
    device_sensors    JSONB DEFAULT '{}',
    weather_snapshot  JSONB DEFAULT '{}',
    duration_seconds  INTEGER NOT NULL,
    quality_flags     JSONB DEFAULT '{}',
    tokens_awarded    INTEGER NOT NULL DEFAULT 0,
    multiplier_applied DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    ad_watched        BOOLEAN NOT NULL DEFAULT false,
    submitted_at      TIMESTAMPTZ NOT NULL,
    processed_at      TIMESTAMPTZ
);

-- For user's survey history
CREATE INDEX idx_surveys_user ON surveys (user_id, submitted_at DESC);
-- For site timeline
CREATE INDEX idx_surveys_site ON surveys (site_id, submitted_at DESC);
-- For daily survey cap check (uses submitted_at range scan instead of cast, which isn't immutable for timestamptz)
CREATE INDEX idx_surveys_user_submitted ON surveys (user_id, submitted_at);
-- For same-site cooldown check
CREATE INDEX idx_surveys_user_site ON surveys (user_id, site_id, submitted_at DESC);

-- ============================================================
-- Monthly Revenue Pool
-- ============================================================
CREATE TABLE monthly_revenue_pool (
    month_key         CHAR(7) PRIMARY KEY,  -- YYYY-MM
    total_ad_revenue  DECIMAL(10,2) NOT NULL DEFAULT 0,
    platform_share    DECIMAL(10,2) NOT NULL DEFAULT 0,
    user_payout_fund  DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_tokens_earned INTEGER NOT NULL DEFAULT 0,
    token_value       DECIMAL(8,6) NOT NULL DEFAULT 0,
    status            pool_status NOT NULL DEFAULT 'accruing',
    calculated_at     TIMESTAMPTZ
);

-- ============================================================
-- Token Ledger
-- ============================================================
CREATE TABLE token_ledger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            token_type NOT NULL,
    amount          INTEGER NOT NULL,
    month_key       CHAR(7) NOT NULL,
    reference_type  token_reference_type NOT NULL,
    reference_id    UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For wallet balance queries
CREATE INDEX idx_token_ledger_user ON token_ledger (user_id, created_at DESC);
-- For monthly aggregation
CREATE INDEX idx_token_ledger_month ON token_ledger (month_key, user_id);
-- For total pool token count
CREATE INDEX idx_token_ledger_month_sum ON token_ledger (month_key) WHERE type != 'withdrawal';

-- ============================================================
-- Streaks
-- ============================================================
CREATE TABLE streaks (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id),
    site_id               UUID NOT NULL REFERENCES sites(id),
    current_streak_weeks  INTEGER NOT NULL DEFAULT 0,
    longest_streak_weeks  INTEGER NOT NULL DEFAULT 0,
    last_survey_week      INTEGER NOT NULL,  -- ISO week
    last_survey_year      INTEGER NOT NULL,  -- ISO year
    streak_at_risk        BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(user_id, site_id)
);

CREATE INDEX idx_streaks_at_risk ON streaks (streak_at_risk) WHERE streak_at_risk = true;

-- ============================================================
-- Referrals
-- ============================================================
CREATE TABLE referrals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id     UUID NOT NULL REFERENCES users(id),
    referred_id     UUID NOT NULL REFERENCES users(id),
    completed       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE(referred_id)  -- each user can only be referred once
);

CREATE INDEX idx_referrals_referrer ON referrals (referrer_id);

-- ============================================================
-- Notification Log
-- ============================================================
CREATE TABLE notification_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    category        notification_category NOT NULL,
    title           VARCHAR(100) NOT NULL,
    body            VARCHAR(255) NOT NULL,
    trigger_type    VARCHAR(50) NOT NULL,
    reference_id    UUID,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at       TIMESTAMPTZ,
    week_number     INTEGER NOT NULL  -- ISO week, for weekly cap enforcement
);

-- For weekly cap check
CREATE INDEX idx_notifications_user_week ON notification_log (user_id, week_number);
-- For open rate analytics
CREATE INDEX idx_notifications_category ON notification_log (category, sent_at);
