import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import {
  Appointment,
  AppointmentService,
  AppointmentStatus,
} from './services/appointment.service';
import { THEME_PRESETS } from './services/theme.service';
import { of } from 'rxjs';

async function enterOperatorPortal(fixture: ComponentFixture<App>): Promise<void> {
  const compiled = fixture.nativeElement as HTMLElement;
  const portalSelect = compiled.querySelector('.portal-switch select') as HTMLSelectElement;
  portalSelect.value = 'operator';
  portalSelect.dispatchEvent(new Event('change'));
  fixture.detectChanges();

  const password = compiled.querySelector('#admin-password') as HTMLInputElement;
  password.value = 'admin123';
  password.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  compiled.querySelector('.admin-login-card form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('App', () => {
  const sampleAppointment: Appointment = {
    id: 1,
    client_name: 'Alex Rivera',
    client_email: 'alex@example.com',
    service_name: 'Consulta',
    appointment_date: '2026-10-23',
    appointment_time: '10:00',
    status: 'pending',
    created_at: '2026-10-23T00:00:00.000Z',
  };

  beforeEach(async () => {
    localStorage.removeItem('timeslot-business-theme');
    let favicon = document.getElementById('favicon');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.id = 'favicon';
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            getAppointments: () => of([sampleAppointment]),
            createAppointment: () =>
              of({
                ...sampleAppointment,
              }),
            updateStatus: (_id: number, status: AppointmentStatus) =>
              of({ ...sampleAppointment, status }),
          },
        },
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the public reservation portal by default', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Solicitar Cita Médica');
    expect(compiled.querySelector('.client-nav')).toBeTruthy();
    expect(compiled.querySelector('.sidebar')).toBeFalsy();
    expect(compiled.querySelector('#client-service')).toBeTruthy();
    expect(document.getElementById('favicon')?.getAttribute('href')).toBe(
      'assets/favicons/hospital.svg',
    );
  });

  it('should expose the requested high-contrast palettes for each business type', () => {
    const expectedPalettes = {
      clinic: [
        ['Azul Clínico', '#0284c7', '#0d9488', '#f8fafc', '#ffffff', '#0f172a'],
        ['Verde Salud', '#059669', '#10b981', '#f0fdf4', '#ffffff', '#064e3b'],
        ['Cobalto Corporativo', '#1e3a8a', '#3b82f6', '#f8fafc', '#ffffff', '#0f172a'],
        ['Púrpura Pediatría', '#7c3aed', '#ec4899', '#faf5ff', '#ffffff', '#3b0764'],
        ['Gris Quirúrgico', '#475569', '#06b6d4', '#f1f5f9', '#ffffff', '#0f172a'],
      ],
      restaurant: [
        ['Bistro Rojo', '#dc2626', '#d97706', '#fffbe8', '#ffffff', '#1c1917'],
        ['Orgánico Oliva', '#65a30d', '#84cc16', '#f7fee7', '#ffffff', '#1a2e05'],
        ['Dark Lounge', '#f97316', '#ea580c', '#09090b', '#18181b', '#f4f4f5'],
        ['Marisquería Océano', '#0284c7', '#eab308', '#f0f9ff', '#ffffff', '#0c4a6e'],
        ['Trattoria Toscana', '#b45309', '#881337', '#fffbeb', '#ffffff', '#451a03'],
      ],
      law: [
        ['Azul Noche & Oro', '#0f172a', '#ca8a04', '#f8fafc', '#ffffff', '#0f172a'],
        ['Grafito & Bronce', '#334155', '#b45309', '#f1f5f9', '#ffffff', '#0f172a'],
        ['Vino Notaría', '#881337', '#be123c', '#fff1f2', '#ffffff', '#4c0519'],
        ['Verde Esmeralda Judicial', '#064e3b', '#d97706', '#f0fdf4', '#ffffff', '#022c22'],
        ['Negro Monocromo', '#18181b', '#64748b', '#f4f4f5', '#ffffff', '#09090b'],
      ],
    } as const;

    for (const [themeId, expected] of Object.entries(expectedPalettes)) {
      const palettes = THEME_PRESETS[themeId as keyof typeof THEME_PRESETS].palettes;
      expect(palettes).toHaveLength(5);
      expect(
        palettes.map(({ name, primary, accent, background, card, text }) => [
          name,
          primary,
          accent,
          background,
          card,
          text,
        ]),
      ).toEqual(expected);
    }
  });

  it('should require a password before showing the operator portal', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const portalSelect = compiled.querySelector('.portal-switch select') as HTMLSelectElement;
    portalSelect.value = 'operator';
    portalSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(compiled.querySelector('.admin-login-card')).toBeTruthy();
    expect(compiled.querySelector('.sidebar')).toBeFalsy();
    expect(compiled.textContent).not.toContain('Directorio de clientes');

    const password = compiled.querySelector('#admin-password') as HTMLInputElement;
    password.value = 'incorrecta';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector('.admin-login-card form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'Contraseña de administrador incorrecta',
    );
    expect(compiled.querySelector('.sidebar')).toBeFalsy();

    password.value = 'admin123';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector('.admin-login-card form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar')).toBeTruthy();
    expect(compiled.querySelector('.client-nav')).toBeFalsy();
    expect(compiled.textContent).toContain('Dashboard & Agenda');

    const buttons = Array.from(compiled.querySelectorAll('.nav-link'));
    buttons.find((button) => button.textContent?.includes('Configuración de servicios'))?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Configuración de servicios');
    expect(compiled.querySelector('.service-edit-fields')).toBeTruthy();

    compiled.querySelector('.logout-button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar')).toBeFalsy();
    expect(compiled.querySelector('.admin-login-card')).toBeFalsy();
    expect(compiled.querySelector('.client-nav')).toBeTruthy();
  });

  it('should update an appointment status through the status control', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    await enterOperatorPortal(fixture);

    const dateFilter = compiled.querySelector('.agenda-filters input[type="date"]') as HTMLInputElement;
    dateFilter.value = sampleAppointment.appointment_date;
    dateFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const select = compiled.querySelector(
      '.status-control select',
    ) as HTMLSelectElement;
    select.value = 'completed';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Completada');
  });

  it('should show matching reservations in the client portal', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const navButton = Array.from(compiled.querySelectorAll('.client-nav-link'))
      .find((button) => button.textContent?.includes('Mis reservas'));
    navButton?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    const emailInput = compiled.querySelector('[name="reservation-email"]') as HTMLInputElement;
    emailInput.value = 'alex@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector('.lookup-form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Consulta');
    expect(compiled.textContent).toContain('Pendiente');
  });

  it('should apply and persist the selected business theme across both portals', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#booking-specialty')).toBeTruthy();
    await enterOperatorPortal(fixture);
    const themeButton = Array.from(compiled.querySelectorAll('.nav-link'))
      .find((button) => button.textContent?.includes('Tema y rubro'));
    themeButton?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    const restaurantCard = Array.from(compiled.querySelectorAll('.theme-card'))
      .find((button) => button.textContent?.includes('Restaurante'));
    restaurantCard?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.querySelector('.theme-card.selected')?.textContent).toContain(
      'Módulos de mesas, comensales y zonas',
    );
    expect(compiled.querySelectorAll('.palette-card')).toHaveLength(5);
    expect(JSON.parse(localStorage.getItem('timeslot-business-theme') ?? '{}')).toEqual({
      themeId: 'restaurant',
      paletteId: 'restaurant-bistro',
    });

    const darkPalette = Array.from(compiled.querySelectorAll('.palette-card'))
      .find((button) => button.textContent?.includes('Dark Lounge'));
    darkPalette?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.querySelector('.theme-preview-booking')?.getAttribute('style')).toContain(
      '--preview-background: #09090b',
    );
    const savedTheme = JSON.parse(localStorage.getItem('timeslot-business-theme') ?? '{}') as {
      themeId?: string;
      paletteId?: string;
    };
    expect(savedTheme).toEqual({ themeId: 'restaurant', paletteId: 'restaurant-dark' });
    expect(compiled.querySelector('.application-shell')?.getAttribute('style')).toContain(
      '--primary-color: #f97316',
    );
    expect(compiled.querySelector('.application-shell')?.getAttribute('style')).toContain(
      '--bg-color: #09090b',
    );
    expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#f97316');
    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#ea580c');
    expect(document.getElementById('favicon')?.getAttribute('href')).toBe(
      'assets/favicons/restaurant.svg',
    );

    compiled.querySelector('.logout-button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.querySelector('#booking-partySize')).toBeTruthy();
    expect(compiled.querySelector('#booking-diningZone')).toBeTruthy();
    expect(compiled.querySelector('#booking-phone')).toBeTruthy();
    expect(compiled.querySelector('#client-booking-title')?.textContent).toContain('Detalles de tu reserva');

    const reloadedFixture = TestBed.createComponent(App);
    reloadedFixture.detectChanges();
    await reloadedFixture.whenStable();
    expect((reloadedFixture.nativeElement as HTMLElement).querySelector('#booking-partySize')).toBeTruthy();
    expect((reloadedFixture.nativeElement as HTMLElement).querySelector('.application-shell')?.getAttribute('style')).toContain(
      '--primary-color: #f97316',
    );
  });

  it('should adapt the client booking form for the legal preset', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    await enterOperatorPortal(fixture);

    Array.from(compiled.querySelectorAll('.nav-link'))
      .find((button) => button.textContent?.includes('Tema y rubro'))
      ?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    Array.from(compiled.querySelectorAll('.theme-card'))
      .find((button) => button.textContent?.includes('Bufete de Abogados'))
      ?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    compiled.querySelector('.logout-button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    expect(compiled.querySelector('h1')?.textContent).toContain('Agendar Consulta Legal');
    expect(compiled.querySelector('#booking-caseType')).toBeTruthy();
    expect(compiled.querySelector('#booking-lawyer')).toBeTruthy();
    expect(document.getElementById('favicon')?.getAttribute('href')).toBe(
      'assets/favicons/legal.svg',
    );
    expect(JSON.parse(localStorage.getItem('timeslot-business-theme') ?? '{}')).toEqual({
      themeId: 'law',
      paletteId: 'law-night',
    });
  });
});
