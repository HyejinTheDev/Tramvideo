import { describe, expect, it } from 'vitest';
import { formatDuration, slugify } from './format';

describe('slugify', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(slugify('Tổng tài Đẹp trai!')).toBe('tong-tai-dep-trai');
  });
});

describe('formatDuration', () => {
  it('định dạng phút:giây', () => {
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});
