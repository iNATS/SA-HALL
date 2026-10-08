import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicHome } from './public-home';

describe('PublicHome', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicHome],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the legacy-inspired demo catalogue', () => {
    const fixture = TestBed.createComponent(PublicHome);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('لحظات الفرح');
    expect(page.querySelectorAll('.venue-card').length).toBe(4);
    expect(page.querySelectorAll('.service-card').length).toBe(4);
    expect(page.textContent).toContain('بيانات تجريبية');
  });

  it('switches the demo search mode and reports search results', () => {
    const fixture = TestBed.createComponent(PublicHome);
    const component = fixture.componentInstance;

    component.setSearchMode('services');
    component.runDemoSearch();

    expect(component.searchMode()).toBe('services');
    expect(component.searchNotice()).toContain('الخدمات');
  });
});
