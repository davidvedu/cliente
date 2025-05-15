import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, NavComponent, FooterComponent, HttpClientModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  usuario = {
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: ''
  };
  
  aceptaTerminos = false;
  cargando = false;
  error: string | null = null;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  registrarse() {
    if (!this.validarFormulario()) return;

    this.cargando = true;
    this.error = null;

    const datosRegistro = {
      nombre: this.usuario.nombre.trim(),
      correo: this.usuario.correo.trim(),
      password: this.usuario.password,
      rol: 'comprador' 
    };

    this.http.post<any>('http://localhost:3000/api/sesion/registro', datosRegistro).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Ocurrió un error durante el registro.';
        this.cargando = false;
      }
    });
  }
  
  validarFormulario(): boolean {
    if (!this.usuario.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    if (!this.usuario.correo.trim()) {
      this.error = 'El correo electrónico es obligatorio';
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.usuario.correo)) {
      this.error = 'El correo electrónico no es válido';
      return false;
    }
    
    if (!this.usuario.password) {
      this.error = 'La contraseña es obligatoria';
      return false;
    }
    
    if (this.usuario.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }
    
    if (this.usuario.password !== this.usuario.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return false;
    }
    
    if (!this.aceptaTerminos) {
      this.error = 'Debes aceptar los términos y condiciones';
      return false;
    }
    
    return true;
  }
}
