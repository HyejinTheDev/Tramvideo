/** Hằng số nghiệp vụ công khai (FE hiển thị, BE kiểm tra). */
export const TOPUP_MIN_AMOUNT = 10_000;
export const TOPUP_MAX_AMOUNT = 5_000_000;
export const TOPUP_PRESETS = [20_000, 50_000, 100_000, 200_000] as const;
export const TOPUP_EXPIRES_MINUTES = 30;
export const TOPUP_CODE_PREFIX = 'TV';

export const DOWNLOADS_PER_VIDEO_PER_DAY = 10;
export const DOWNLOAD_LINK_TTL_SECONDS = 600;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
