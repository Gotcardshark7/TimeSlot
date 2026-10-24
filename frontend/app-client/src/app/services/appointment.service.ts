import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppointmentPayload {
  client_name: string;
  client_email: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
}

export interface Appointment extends AppointmentPayload {
  id: number;
  status: string;
  created_at: string;
}

export type AppointmentStatus = 'pending' | 'completed' | 'cancelled';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/appointments';

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  createAppointment(appointment: AppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}/status`, { status });
  }
}
