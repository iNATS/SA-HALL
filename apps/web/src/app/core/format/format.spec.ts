import { toCsv } from './csv';
import { addDays, daysBetween, formatDate, formatSar, localDate, toIsoDate } from './format';

describe('format', () => {
  it('formats riyals with grouping and a consistent currency label', () => {
    expect(formatSar(18500)).toBe('18,500 ر.س');
    expect(formatSar(-4899)).toBe('−4,899 ر.س');
  });

  it('formats Gregorian dates in Arabic with Latin digits', () => {
    expect(formatDate('2026-11-18')).toBe('18 نوفمبر 2026');
  });

  it('does calendar arithmetic across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-10-08', '2026-11-18')).toBe(41);
  });

  it('round-trips local dates used by date pickers', () => {
    expect(toIsoDate(localDate('2026-02-28'))).toBe('2026-02-28');
  });
});

describe('csv', () => {
  it('quotes text and escapes embedded quotes', () => {
    expect(toCsv([['قاعة "ليلك"', 100]])).toBe('"قاعة ""ليلك""",100');
  });

  it('neutralises spreadsheet formula injection in text cells', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '-2', '@cmd']])).toBe(
      `"'=HYPERLINK(""x"")","'+1","'-2","'@cmd"`,
    );
  });

  it('writes numbers as numbers, including negatives', () => {
    expect(toCsv([[-319, 0]])).toBe('-319,0');
  });
});
