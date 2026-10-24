import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly developmentPassword = 'admin123';

  isPasswordValid(password: string): boolean {
    return password === this.developmentPassword;
  }
}
