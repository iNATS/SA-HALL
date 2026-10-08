import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PUBLIC_NAV } from '../../core/navigation/navigation';
import { BottomNav } from './bottom-nav';

@Component({ template: '' })
class Blank {}

describe('BottomNav', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [provideRouter([{ path: '**', component: Blank }])],
    });
  });

  it('marks only the current destination with aria-current and a filled indicator', async () => {
    await TestBed.inject(Router).navigateByUrl('/halls/lilac-royal');
    const fixture = TestBed.createComponent(BottomNav);
    fixture.componentRef.setInput('items', PUBLIC_NAV);
    await fixture.whenStable();

    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
    const current = links.filter((link) => link.getAttribute('aria-current') === 'page');
    expect(links.length).toBe(PUBLIC_NAV.length);
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain('القاعات');
  });

  it('offers a labelled "more" entry when requested', async () => {
    const fixture = TestBed.createComponent(BottomNav);
    fixture.componentRef.setInput('items', PUBLIC_NAV.slice(0, 4));
    fixture.componentRef.setInput('moreLabel', 'المزيد');
    let opened = false;
    fixture.componentInstance.moreRequested.subscribe(() => (opened = true));
    await fixture.whenStable();

    const more = (fixture.nativeElement as HTMLElement).querySelector('button');
    more?.click();
    expect(more?.textContent).toContain('المزيد');
    expect(opened).toBe(true);
  });
});
