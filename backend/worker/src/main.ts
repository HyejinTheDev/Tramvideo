/**
 * Worker xử lý video (giai đoạn 6 trong lộ trình):
 * nhận job BullMQ → tải file gốc từ R2 → ffmpeg cắt preview + watermark + thumbnail
 * → upload bucket public → cập nhật previewKey/thumbnailKey.
 * Giai đoạn đầu admin tự cắt preview bằng ffmpeg rồi upload (xem dan_y.md 10.5).
 */
console.log('worker: chưa triển khai (giai đoạn sau)');
