/** Lấy thời gian hiện tại qua port để test dễ (giả lập thời gian). */
export abstract class ClockPort {
  abstract now(): Date;
}

export class SystemClock extends ClockPort {
  now(): Date {
    return new Date();
  }
}
