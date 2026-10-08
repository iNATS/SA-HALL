import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'sh.favorites';

/** Saved halls, kept per device. Storage can be unavailable (private mode), so it is optional. */
@Injectable({ providedIn: 'root' })
export class Favorites {
  private readonly slugs = signal<ReadonlySet<string>>(this.restore());
  readonly count = computed(() => this.slugs().size);

  has(slug: string): boolean {
    return this.slugs().has(slug);
  }

  all(): ReadonlySet<string> {
    return this.slugs();
  }

  toggle(slug: string): boolean {
    const next = new Set(this.slugs());
    const added = !next.delete(slug);
    if (added) {
      next.add(slug);
    }
    this.slugs.set(next);
    this.persist(next);
    return added;
  }

  private restore(): ReadonlySet<string> {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : ['lilac-royal'];
      return new Set(
        Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [],
      );
    } catch {
      return new Set(['lilac-royal']);
    }
  }

  private persist(value: ReadonlySet<string>): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify([...value]));
    } catch {
      // Storage is a convenience only; the in-memory state remains correct.
    }
  }
}
