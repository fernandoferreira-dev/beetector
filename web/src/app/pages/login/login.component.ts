import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  passwordVisible = false;
  userEmail = '';
  userPassword = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  login(): void {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.userEmail, this.userPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = error instanceof HttpErrorResponse
          && (error.status === 400 || error.status === 401)
          ? 'Email ou palavra-passe incorretos.'
          : 'Não foi possível iniciar sessão. Tente novamente.';
      }
    });
  }
}
