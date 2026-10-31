import { DomainError } from '../../../shared/domain/domain-error';

export class VideoNotFoundError extends DomainError {
  constructor() {
    super('VIDEO_NOT_FOUND', 'Video không tồn tại hoặc chưa được đăng');
  }
}

export class VideoNotReadyError extends DomainError {
  constructor(missing: string[]) {
    super('VIDEO_NOT_READY', `Chưa đủ file để đăng: thiếu ${missing.join(', ')}`);
  }
}

export class SlugTakenError extends DomainError {
  constructor() {
    super('SLUG_TAKEN', 'Slug đã được dùng cho video khác');
  }
}
