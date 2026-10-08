import { ADMIN_NAV, OWNER_NAV, PUBLIC_NAV, isNavActive } from './navigation';

describe('navigation', () => {
  const [home, halls, , bookings, account] = PUBLIC_NAV;

  it('matches the home destination exactly', () => {
    expect(isNavActive(home, '/')).toBe(true);
    expect(isNavActive(home, '/halls')).toBe(false);
  });

  it('keeps a destination active on nested routes, ignoring query strings', () => {
    expect(isNavActive(halls, '/halls/lilac-royal')).toBe(true);
    expect(isNavActive(halls, '/halls?city=جدة')).toBe(true);
    expect(isNavActive(halls, '/hallsx')).toBe(false);
  });

  it('highlights the account tab for every account sub-page', () => {
    expect(isNavActive(account, '/client/orders')).toBe(true);
    expect(isNavActive(account, '/client/favorites')).toBe(true);
    expect(isNavActive(bookings, '/client/bookings/SH-24081')).toBe(true);
    expect(isNavActive(account, '/client/bookings')).toBe(false);
  });

  it('follows Material 3 limits for compact navigation bars', () => {
    expect(PUBLIC_NAV.length).toBeLessThanOrEqual(5);
    // Four primary destinations plus the "more" entry.
    expect(OWNER_NAV.primary.length).toBe(4);
    expect(ADMIN_NAV.primary.length).toBe(4);
  });

  it('only promotes destinations that exist in the drawer', () => {
    for (const nav of [OWNER_NAV, ADMIN_NAV]) {
      const paths = nav.groups.flatMap((group) => group.items.map((item) => item.path));
      for (const item of nav.primary) {
        expect(paths).toContain(item.path);
      }
    }
  });
});
