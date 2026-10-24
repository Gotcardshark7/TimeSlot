import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export type ThemeId = 'clinic' | 'restaurant' | 'law';
export type ThemeFieldControl =
  | 'specialty'
  | 'doctor'
  | 'documentNumber'
  | 'partySize'
  | 'diningZone'
  | 'phone'
  | 'caseType'
  | 'lawyer';

export interface ThemeField {
  control: ThemeFieldControl;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  text: string;
  card: string;
  primaryHover: string;
  soft: string;
  softer: string;
  border: string;
}

export interface ThemePreset {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  bookingTitle: string;
  bookingHeading: string;
  serviceFieldLabel: string;
  customerNameLabel: string;
  contactLabel: string;
  fields: ThemeField[];
  palettes: ColorPalette[];
}

export interface ThemeSelection {
  themeId: ThemeId;
  paletteId: string;
}

const clinicFields: ThemeField[] = [
  { control: 'specialty', label: 'Especialidad médica', placeholder: 'Ej. Cardiología', type: 'text' },
  { control: 'doctor', label: 'Doctor', placeholder: 'Nombre del doctor', type: 'text' },
  { control: 'documentNumber', label: 'Nro. de documento / cédula', placeholder: 'Número de documento', type: 'text' },
];

const restaurantFields: ThemeField[] = [
  { control: 'partySize', label: 'Número de comensales', placeholder: '2', type: 'number' },
  { control: 'diningZone', label: 'Zona / Mesa', placeholder: 'Selecciona una zona', type: 'select', options: ['Salón', 'Terraza'] },
  { control: 'phone', label: 'Teléfono', placeholder: '+1 555 123 4567', type: 'text' },
];

const lawFields: ThemeField[] = [
  { control: 'caseType', label: 'Tipo de caso / materia legal', placeholder: 'Ej. Derecho laboral', type: 'text' },
  { control: 'lawyer', label: 'Abogado asignado', placeholder: 'Nombre del abogado', type: 'text' },
];

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  clinic: {
    id: 'clinic',
    name: 'Hospital / Clínica',
    icon: '🏥',
    description: 'Gestión de médicos, especialidades y pacientes.',
    bookingTitle: 'Solicitar Cita Médica',
    bookingHeading: 'Datos de la consulta',
    serviceFieldLabel: 'Especialidad médica',
    customerNameLabel: 'Nombre del paciente',
    contactLabel: 'Correo electrónico',
    fields: clinicFields,
    palettes: [
      { id: 'clinic-sky', name: 'Azul Clínico', primary: '#0284c7', accent: '#0d9488', background: '#f8fafc', text: '#0f172a', card: '#ffffff', primaryHover: '#0369a1', soft: '#e0f2fe', softer: '#f0f9ff', border: '#bae6fd' },
      { id: 'clinic-green', name: 'Verde Salud', primary: '#059669', accent: '#10b981', background: '#f0fdf4', text: '#064e3b', card: '#ffffff', primaryHover: '#047857', soft: '#d1fae5', softer: '#ecfdf5', border: '#a7f3d0' },
      { id: 'clinic-cobalt', name: 'Cobalto Corporativo', primary: '#1e3a8a', accent: '#3b82f6', background: '#f8fafc', text: '#0f172a', card: '#ffffff', primaryHover: '#172554', soft: '#dbeafe', softer: '#eff6ff', border: '#bfdbfe' },
      { id: 'clinic-pediatric', name: 'Púrpura Pediatría', primary: '#7c3aed', accent: '#ec4899', background: '#faf5ff', text: '#3b0764', card: '#ffffff', primaryHover: '#6d28d9', soft: '#ede9fe', softer: '#f5f3ff', border: '#ddd6fe' },
      { id: 'clinic-surgical', name: 'Gris Quirúrgico', primary: '#475569', accent: '#06b6d4', background: '#f1f5f9', text: '#0f172a', card: '#ffffff', primaryHover: '#334155', soft: '#e2e8f0', softer: '#f8fafc', border: '#cbd5e1' },
    ],
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurante / Gastronomía',
    icon: '🍽️',
    description: 'Módulos de mesas, comensales y zonas.',
    bookingTitle: 'Reservar Mesa',
    bookingHeading: 'Detalles de tu reserva',
    serviceFieldLabel: 'Experiencia',
    customerNameLabel: 'Nombre de contacto',
    contactLabel: 'Correo electrónico',
    fields: restaurantFields,
    palettes: [
      { id: 'restaurant-bistro', name: 'Bistro Rojo', primary: '#dc2626', accent: '#d97706', background: '#fffbe8', text: '#1c1917', card: '#ffffff', primaryHover: '#b91c1c', soft: '#fee2e2', softer: '#fff7ed', border: '#fed7aa' },
      { id: 'restaurant-olive', name: 'Orgánico Oliva', primary: '#65a30d', accent: '#84cc16', background: '#f7fee7', text: '#1a2e05', card: '#ffffff', primaryHover: '#4d7c0f', soft: '#ecfccb', softer: '#f7fee7', border: '#d9f99d' },
      { id: 'restaurant-dark', name: 'Dark Lounge', primary: '#f97316', accent: '#ea580c', background: '#09090b', text: '#f4f4f5', card: '#18181b', primaryHover: '#ea580c', soft: '#27272a', softer: '#18181b', border: '#3f3f46' },
      { id: 'restaurant-ocean', name: 'Marisquería Océano', primary: '#0284c7', accent: '#eab308', background: '#f0f9ff', text: '#0c4a6e', card: '#ffffff', primaryHover: '#0369a1', soft: '#e0f2fe', softer: '#f0f9ff', border: '#bae6fd' },
      { id: 'restaurant-tuscany', name: 'Trattoria Toscana', primary: '#b45309', accent: '#881337', background: '#fffbeb', text: '#451a03', card: '#ffffff', primaryHover: '#92400e', soft: '#fef3c7', softer: '#fffbeb', border: '#fcd34d' },
    ],
  },
  law: {
    id: 'law',
    name: 'Bufete de Abogados',
    icon: '⚖️',
    description: 'Asesorías jurídicas, tipos de caso y legajos.',
    bookingTitle: 'Agendar Consulta Legal',
    bookingHeading: 'Detalles de la consulta legal',
    serviceFieldLabel: 'Tipo de asesoría',
    customerNameLabel: 'Nombre del cliente',
    contactLabel: 'Correo electrónico',
    fields: lawFields,
    palettes: [
      { id: 'law-night', name: 'Azul Noche & Oro', primary: '#0f172a', accent: '#ca8a04', background: '#f8fafc', text: '#0f172a', card: '#ffffff', primaryHover: '#020617', soft: '#e2e8f0', softer: '#f1f5f9', border: '#cbd5e1' },
      { id: 'law-graphite', name: 'Grafito & Bronce', primary: '#334155', accent: '#b45309', background: '#f1f5f9', text: '#0f172a', card: '#ffffff', primaryHover: '#1e293b', soft: '#e2e8f0', softer: '#f8fafc', border: '#cbd5e1' },
      { id: 'law-wine', name: 'Vino Notaría', primary: '#881337', accent: '#be123c', background: '#fff1f2', text: '#4c0519', card: '#ffffff', primaryHover: '#6b102c', soft: '#ffe4e6', softer: '#fff1f2', border: '#fecdd3' },
      { id: 'law-emerald', name: 'Verde Esmeralda Judicial', primary: '#064e3b', accent: '#d97706', background: '#f0fdf4', text: '#022c22', card: '#ffffff', primaryHover: '#022c22', soft: '#d1fae5', softer: '#ecfdf5', border: '#a7f3d0' },
      { id: 'law-monochrome', name: 'Negro Monocromo', primary: '#18181b', accent: '#64748b', background: '#f4f4f5', text: '#09090b', card: '#ffffff', primaryHover: '#09090b', soft: '#e4e4e7', softer: '#f4f4f5', border: '#d4d4d8' },
    ],
  },
};

const STORAGE_KEY = 'timeslot-business-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  loadSelection(): ThemeSelection {
    const savedValue = globalThis.localStorage.getItem(STORAGE_KEY);
    let selection: ThemeSelection;

    if (!savedValue) {
      selection = { themeId: 'clinic', paletteId: 'clinic-sky' };
    } else {
      try {
        const saved: unknown = JSON.parse(savedValue);
        if (
          saved !== null &&
          typeof saved === 'object' &&
          'themeId' in saved &&
          'paletteId' in saved &&
          this.isThemeId(saved.themeId) &&
          this.isPalette(saved.themeId, saved.paletteId)
        ) {
          selection = { themeId: saved.themeId, paletteId: saved.paletteId };
        } else {
          selection = { themeId: 'clinic', paletteId: 'clinic-sky' };
        }
      } catch {
        selection = this.isThemeId(savedValue)
          ? { themeId: savedValue, paletteId: THEME_PRESETS[savedValue].palettes[0].id }
          : { themeId: 'clinic', paletteId: 'clinic-sky' };
      }
    }

    this.applySelection(selection);
    return selection;
  }

  saveSelection(selection: ThemeSelection): void {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    this.applySelection(selection);
  }

  private applySelection(selection: ThemeSelection): void {
    const palette = THEME_PRESETS[selection.themeId].palettes.find(
      (candidate) => candidate.id === selection.paletteId,
    );
    if (!palette) {
      throw new Error(`Unknown palette "${selection.paletteId}" for theme "${selection.themeId}".`);
    }

    const rootStyle = this.document.documentElement.style;
    rootStyle.setProperty('--primary-color', palette.primary);
    rootStyle.setProperty('--primary-hover', palette.primaryHover);
    rootStyle.setProperty('--accent-color', palette.accent);
    rootStyle.setProperty('--bg-color', palette.background);
    rootStyle.setProperty('--card-bg', palette.card);
    rootStyle.setProperty('--text-color', palette.text);
    rootStyle.setProperty('--text-muted', `color-mix(in srgb, ${palette.text} 65%, transparent)`);
    rootStyle.setProperty('--border-color', palette.border);
    rootStyle.setProperty('--primary-soft', palette.soft);
    rootStyle.setProperty('--primary-softer', palette.softer);
    this.updateFavicon(selection.themeId);
  }

  updateFavicon(themeId: ThemeId): void {
    const favicon = this.document.getElementById('favicon');
    if (favicon?.tagName.toLowerCase() === 'link') {
      const faviconName = themeId === 'law' ? 'legal' : themeId === 'clinic' ? 'hospital' : 'restaurant';
      favicon.setAttribute('href', `assets/favicons/${faviconName}.svg`);
      favicon.setAttribute('type', 'image/svg+xml');
    }
  }

  private isThemeId(value: unknown): value is ThemeId {
    return value === 'clinic' || value === 'restaurant' || value === 'law';
  }

  private isPalette(themeId: ThemeId, paletteId: unknown): paletteId is string {
    return typeof paletteId === 'string' &&
      THEME_PRESETS[themeId].palettes.some((palette) => palette.id === paletteId);
  }
}
