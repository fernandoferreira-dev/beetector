import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
t('should toggle password visibility', () => {
    const passwordInput = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    const toggleButton = fixture.nativeElement.querySelector('#toggle-password') as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');

    toggleButton.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');
    expect(toggleButton.getAttribute('aria-label')).toBe('Ocultar palavra-passe');

    toggleButton.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('password');
  });
});
