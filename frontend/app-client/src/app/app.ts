import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Appointment,
  AppointmentService,
  AppointmentStatus,
} from './services/appointment.service';
import { AdminAuthService } from './services/admin-auth.service';
import {
  ColorPalette,
  THEME_PRESETS,
  ThemeField,
  ThemeFieldControl,
  ThemeId,
  ThemePreset,
  ThemeService,
} from './services/theme.service';

registerLocaleData(localeEs);

type Portal = 'client' | 'operator';
type ClientView = 'booking' | 'reservations' | 'services';
type OperatorView = 'dashboard' | 'services' | 'schedule' | 'clients' | 'theme';
type AppointmentFilter = 'all' | 'pending' | 'completed' | 'cancelled';

interface ServiceInfo {
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface ClientSummary {
  name: string;
  email: string;
  appointments: number;
  lastAppointment: string;
}

interface WorkDay {
  label: string;
  short: string;
  enabled: boolean;
}

interface BlockedHour {
  id: number;
  date: string;
  time: string;
}

@Component({
  imports: [DatePipe, ReactiveFormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly themeService = inject(ThemeService);
  protected readonly initialThemeSelection = this.themeService.loadSelection();

  protected readonly operatorNavigation: { id: OperatorView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard & Agenda', icon: '▦' },
    { id: 'services', label: 'Configuración de servicios', icon: '⚒' },
    { id: 'schedule', label: 'Horarios de atención', icon: '◷' },
    { id: 'clients', label: 'Directorio de clientes', icon: '♧' },
    { id: 'theme', label: 'Tema y rubro', icon: '◉' },
  ];
  protected readonly clientNavigation: { id: ClientView; label: string; icon: string }[] = [
    { id: 'booking', label: 'Reservar cita', icon: '▦' },
    { id: 'reservations', label: 'Mis reservas', icon: '⌕' },
    { id: 'services', label: 'Servicios y tarifas', icon: 'ⓘ' },
  ];
  protected readonly serviceCatalog: ServiceInfo[] = [
    { name: 'Consulta', description: 'Atención personalizada', duration: 45, price: 45 },
    { name: 'Mantenimiento', description: 'Revisión y puesta a punto', duration: 60, price: 60 },
    { name: 'Asesoría', description: 'Orientación especializada', duration: 30, price: 35 },
  ];
  protected readonly workDays: WorkDay[] = [
    { label: 'Lunes', short: 'Lun', enabled: true },
    { label: 'Martes', short: 'Mar', enabled: true },
    { label: 'Miércoles', short: 'Mié', enabled: true },
    { label: 'Jueves', short: 'Jue', enabled: true },
    { label: 'Viernes', short: 'Vie', enabled: true },
    { label: 'Sábado', short: 'Sáb', enabled: false },
    { label: 'Domingo', short: 'Dom', enabled: false },
  ];
  protected readonly today = this.getToday();
  protected readonly appointmentForm = this.formBuilder.nonNullable.group({
    client_name: ['', [Validators.required, Validators.maxLength(100)]],
    client_email: ['', [Validators.required, Validators.email]],
    service_name: ['Consulta', Validators.required],
    appointment_date: ['', Validators.required],
    appointment_time: ['', Validators.required],
    specialty: [''],
    doctor: [''],
    documentNumber: [''],
    partySize: [''],
    diningZone: [''],
    phone: [''],
    caseType: [''],
    lawyer: [''],
  });
  protected readonly adminLoginForm = this.formBuilder.nonNullable.group({
    password: ['', Validators.required],
  });
  protected appointments: Appointment[] = [];
  protected selectedThemeId: ThemeId = this.initialThemeSelection.themeId;
  protected selectedPaletteId = this.initialThemeSelection.paletteId;
  protected draftThemeId: ThemeId = this.initialThemeSelection.themeId;
  protected draftPaletteId = this.initialThemeSelection.paletteId;
  protected isAdminLoggedIn = false;
  protected activePortal: Portal = 'client';
  protected activeClientView: ClientView = 'booking';
  protected activeOperatorView: OperatorView = 'dashboard';
  protected dashboardDate = this.today;
  protected dashboardStatus: AppointmentFilter = 'all';
  protected reservationEmail = '';
  protected hasSearchedReservations = false;
  protected blockedDate = this.today;
  protected blockedTime = '12:00';
  protected blockedHours: BlockedHour[] = [];
  protected nextBlockedHourId = 1;
  protected openingTime = '09:00';
  protected closingTime = '18:00';
  protected isLoading = true;
  protected isSubmitting = false;
  protected updatingAppointmentId: number | null = null;
  protected errorMessage = '';
  protected successMessage = '';

  protected get clients(): ClientSummary[] {
    const clients = new Map<string, ClientSummary>();

    for (const appointment of this.appointments) {
      const email = appointment.client_email.trim().toLowerCase();
      const existing = clients.get(email);
      if (existing) {
        existing.appointments += 1;
        if (appointment.appointment_date > existing.lastAppointment) {
          existing.lastAppointment = appointment.appointment_date;
        }
      } else {
        clients.set(email, {
          name: appointment.client_name,
          email: appointment.client_email,
          appointments: 1,
          lastAppointment: appointment.appointment_date,
        });
      }
    }

    return Array.from(clients.values()).sort((first, second) =>
      first.name.localeCompare(second.name, 'es'),
    );
  }

  protected get pendingAppointments(): number {
    return this.appointments.filter(
      (appointment) => appointment.status.toLowerCase() === 'pending',
    ).length;
  }

  protected get appointmentsToday(): number {
    return this.appointments.filter(
      (appointment) => appointment.appointment_date === this.today,
    ).length;
  }

  protected get filteredAppointments(): Appointment[] {
    return this.appointments.filter((appointment) => {
      const matchesDate = appointment.appointment_date === this.dashboardDate;
      const matchesStatus =
        this.dashboardStatus === 'all' ||
        appointment.status.toLowerCase() === this.dashboardStatus;
      return matchesDate && matchesStatus;
    });
  }

  protected get myReservations(): Appointment[] {
    if (!this.hasSearchedReservations || !this.reservationEmail.trim()) {
      return [];
    }

    const email = this.reservationEmail.trim().toLowerCase();
    return this.appointments.filter(
      (appointment) => appointment.client_email.trim().toLowerCase() === email,
    );
  }

  protected get activeWorkDays(): number {
    return this.workDays.filter((day) => day.enabled).length;
  }

  protected get theme(): ThemePreset & Omit<ColorPalette, 'id' | 'name'> {
    return {
      ...this.activePalette,
      ...THEME_PRESETS[this.selectedThemeId],
    };
  }

  protected get themePresets(): ThemePreset[] {
    return Object.values(THEME_PRESETS);
  }

  protected get draftPalettes(): ColorPalette[] {
    return THEME_PRESETS[this.draftThemeId].palettes;
  }

  protected get draftTheme(): ThemePreset {
    return THEME_PRESETS[this.draftThemeId];
  }

  protected get draftPalette(): ColorPalette {
    return this.draftPalettes.find((palette) => palette.id === this.draftPaletteId)
      ?? this.draftPalettes[0];
  }

  private get activePalette(): ColorPalette {
    return THEME_PRESETS[this.selectedThemeId].palettes.find(
      (palette) => palette.id === this.selectedPaletteId,
    ) ?? THEME_PRESETS[this.selectedThemeId].palettes[0];
  }

  protected get draftBookingFields(): ThemeField[] {
    return this.draftTheme.fields;
  }

  protected get themedBookingFields(): ThemeField[] {
    return this.theme.fields;
  }

  ngOnInit(): void {
    this.applyThemeValidators();
    this.loadAppointments();
  }

  protected setPortal(portal: Portal): void {
    this.activePortal = portal;
    this.errorMessage = '';
    this.successMessage = '';
    if (portal === 'operator' && !this.isAdminLoggedIn) {
      this.adminLoginForm.reset();
    }
  }

  protected changePortal(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    if (target.value === 'client' || target.value === 'operator') {
      this.setPortal(target.value);
    }
  }

  protected setClientView(view: ClientView): void {
    this.activeClientView = view;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected setOperatorView(view: OperatorView): void {
    this.activeOperatorView = view;
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected selectDraftTheme(themeId: ThemeId): void {
    this.draftThemeId = themeId;
    this.draftPaletteId = THEME_PRESETS[themeId].palettes[0].id;
    this.persistDraftTheme();
  }

  protected selectDraftPalette(paletteId: string): void {
    if (this.draftPalettes.some((palette) => palette.id === paletteId)) {
      this.draftPaletteId = paletteId;
      this.persistDraftTheme();
    }
  }

  private persistDraftTheme(): void {
    this.selectedThemeId = this.draftThemeId;
    this.selectedPaletteId = this.draftPaletteId;
    this.themeService.saveSelection({
      themeId: this.selectedThemeId,
      paletteId: this.selectedPaletteId,
    });
    this.applyThemeValidators();
    this.errorMessage = '';
    this.successMessage = `La paleta ${this.activePalette.name} se aplicó en ambos portales.`;
  }

  private applyThemeValidators(): void {
    const activeControls = new Set(this.theme.fields.map((field) => field.control));
    const dynamicControls: ThemeFieldControl[] = [
      'specialty',
      'doctor',
      'documentNumber',
      'partySize',
      'diningZone',
      'phone',
      'caseType',
      'lawyer',
    ];

    for (const controlName of dynamicControls) {
      const control = this.appointmentForm.controls[controlName];
      if (activeControls.has(controlName)) {
        control.setValidators(Validators.required);
      } else {
        control.clearValidators();
        control.reset('');
      }
      control.updateValueAndValidity();
    }
  }

  protected submitAdminLogin(): void {
    this.adminLoginForm.markAllAsTouched();
    if (this.adminLoginForm.invalid) {
      return;
    }

    if (!this.adminAuthService.isPasswordValid(this.adminLoginForm.controls.password.value)) {
      this.errorMessage = 'Contraseña de administrador incorrecta';
      this.adminLoginForm.controls.password.setValue('');
      return;
    }

    this.isAdminLoggedIn = true;
    this.adminLoginForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected logoutAdmin(): void {
    this.isAdminLoggedIn = false;
    this.activePortal = 'client';
    this.activeOperatorView = 'dashboard';
    this.adminLoginForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected searchReservations(): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.reservationEmail.trim())) {
      this.errorMessage = 'Ingresa un correo electrónico válido para consultar tus reservas.';
      this.hasSearchedReservations = false;
      return;
    }

    this.errorMessage = '';
    this.hasSearchedReservations = true;
  }

  protected updateReservationEmail(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.reservationEmail = target.value;
      this.hasSearchedReservations = false;
    }
  }

  protected selectService(service: string): void {
    this.appointmentForm.controls.service_name.setValue(service);
    this.setClientView('booking');
  }

  protected updateDashboardDate(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.dashboardDate = target.value;
    }
  }

  protected updateDashboardStatus(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    switch (target.value) {
      case 'all':
      case 'pending':
      case 'completed':
      case 'cancelled':
        this.dashboardStatus = target.value;
        break;
    }
  }

  protected updateService(service: ServiceInfo, field: 'price' | 'duration', event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const value = Number(target.value);
    if (!Number.isFinite(value) || value <= 0) {
      target.value = String(service[field]);
      this.errorMessage = field === 'price'
        ? 'El precio debe ser mayor que cero.'
        : 'La duración debe ser mayor que cero.';
      return;
    }

    service[field] = value;
    this.errorMessage = '';
  }

  protected toggleWorkDay(day: WorkDay): void {
    day.enabled = !day.enabled;
  }

  protected updateWorkHours(field: 'opening' | 'closing', event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.value) {
      return;
    }

    const nextOpening = field === 'opening' ? target.value : this.openingTime;
    const nextClosing = field === 'closing' ? target.value : this.closingTime;
    if (nextOpening >= nextClosing) {
      target.value = field === 'opening' ? this.openingTime : this.closingTime;
      this.errorMessage = 'La hora de fin debe ser posterior a la hora de inicio.';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    if (field === 'opening') {
      this.openingTime = target.value;
    } else {
      this.closingTime = target.value;
    }
  }

  protected addBlockedHour(): void {
    if (!this.blockedDate || !this.blockedTime) {
      this.errorMessage = 'Selecciona una fecha y hora para crear un bloqueo.';
      return;
    }
    if (this.blockedHours.some(
      (block) => block.date === this.blockedDate && block.time === this.blockedTime,
    )) {
      this.errorMessage = 'Ese horario ya está bloqueado.';
      return;
    }

    this.errorMessage = '';
    this.blockedHours = [
      ...this.blockedHours,
      { id: this.nextBlockedHourId++, date: this.blockedDate, time: this.blockedTime },
    ].sort((first, second) =>
      `${first.date}${first.time}`.localeCompare(`${second.date}${second.time}`),
    );
  }

  protected removeBlockedHour(id: number): void {
    this.blockedHours = this.blockedHours.filter((block) => block.id !== id);
  }

  protected updateBlockedDate(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.blockedDate = target.value;
    }
  }

  protected updateBlockedTime(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.blockedTime = target.value;
    }
  }

  protected submitAppointment(): void {
    this.appointmentForm.markAllAsTouched();
    if (this.appointmentForm.invalid || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.appointmentService.createAppointment(this.appointmentForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Tu reserva se registró correctamente.';
        this.appointmentForm.reset({
          client_name: '',
          client_email: '',
          service_name: 'Consulta',
          appointment_date: '',
          appointment_time: '',
        });
        this.loadAppointments();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(error);
      },
    });
  }

  protected refreshAppointments(): void {
    this.successMessage = '';
    this.loadAppointments();
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };
    return labels[status.toLowerCase()] ?? status;
  }

  protected updateAppointmentStatus(appointment: Appointment, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    let status: AppointmentStatus;
    switch (target.value) {
      case 'pending':
        status = 'pending';
        break;
      case 'completed':
        status = 'completed';
        break;
      case 'cancelled':
        status = 'cancelled';
        break;
      default:
        return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.updatingAppointmentId = appointment.id;
    this.appointmentService
      .updateStatus(appointment.id, status)
      .subscribe({
        next: (updatedAppointment) => {
          this.appointments = this.appointments.map((current) =>
            current.id === updatedAppointment.id ? updatedAppointment : current,
          );
          this.updatingAppointmentId = null;
          this.successMessage = 'El estado de la cita se actualizó.';
        },
        error: (error: HttpErrorResponse) => {
          this.updatingAppointmentId = null;
          this.errorMessage = this.getErrorMessage(error);
          target.value = appointment.status;
        },
      });
  }

  private loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const apiMessage = error.error?.error;
    if (typeof apiMessage === 'string') {
      return apiMessage;
    }
    return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
  }

  private getToday(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }
}
