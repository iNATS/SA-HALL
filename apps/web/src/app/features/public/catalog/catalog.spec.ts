import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from './catalog';

describe('Catalog filters', () => {
  async function render(params: Record<string, string>) {
    TestBed.configureTestingModule({ imports: [Catalog], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Catalog);
    for (const [key, value] of Object.entries(params)) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return {
      names: [...element.querySelectorAll('app-hall-card h3')].map((h) => h.textContent?.trim()),
      chips: [...element.querySelectorAll('mat-chip-set mat-chip')].map((c) =>
        c.textContent?.trim(),
      ),
    };
  }

  it('combines budget and instant-booking filters', async () => {
    const { names } = await render({ budget: '15000', instant: '1' });
    // Default order is highest rating first (4.7 before 4.6).
    expect(names).toEqual(['قاعة نورا', 'حديقة فيوليت']);
  });

  it('hides halls already booked on the chosen date', async () => {
    const { names } = await render({ city: 'الرياض', date: '2026-11-18' });
    expect(names).toEqual(['حديقة فيوليت']);
  });

  it('lists every applied filter as a removable chip', async () => {
    const { chips } = await render({ city: 'جدة', guests: '300', budget: '25000' });
    expect(chips.length).toBe(3);
    expect(chips.join(' ')).toContain('جدة');
    expect(chips.join(' ')).toContain('حتى 300 ضيف');
  });
});
