/** Base class cho entity: so sánh bằng id. */
export abstract class Entity<TId extends string = string> {
  protected constructor(readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    return !!other && other.id === this.id;
  }
}
