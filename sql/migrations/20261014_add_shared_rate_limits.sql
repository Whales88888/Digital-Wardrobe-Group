USE digital_wardrobe;

CREATE TABLE rate_limit_counters (
    rate_limit_key VARCHAR(512) NOT NULL,
    throttler_name VARCHAR(64) NOT NULL,
    last_seen_at DATETIME(3) NOT NULL,
    PRIMARY KEY (rate_limit_key, throttler_name),
    INDEX idx_rate_limit_counters_last_seen (last_seen_at)
);

CREATE TABLE rate_limit_hits (
    rate_limit_hit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rate_limit_key VARCHAR(512) NOT NULL,
    throttler_name VARCHAR(64) NOT NULL,
    hit_at DATETIME(3) NOT NULL,
    INDEX idx_rate_limit_hits_window (rate_limit_key, throttler_name, hit_at),
    INDEX idx_rate_limit_hits_expiry (hit_at)
);
