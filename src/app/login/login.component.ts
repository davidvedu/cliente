import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, NavComponent, HttpClientModule, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credenciales = {
    correo: '',
    password: ''
  };
  
  cargando = false;
  error = '';
  
  constructor(private http: HttpClient, private router: Router) {}
  
  iniciarSesion() {
    if (!this.credenciales.correo || !this.credenciales.password) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    this.cargando = true;
    this.error = '';
    
    this.http.post<any>('http://localhost:3000/api/sesion/login', this.credenciales).subscribe({
      next: (res) => {
        // En tu método de login, después de recibir la respuesta:
        localStorage.setItem('token', res.token);
        console.log('Token guardado:', res.token.substring(0, 20) + '...');
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.router.navigate(['/anuncios']);
      },
      error: (err) => {
        console.error('Error completo:', err);
        this.error = err.error?.error || 'Error al iniciar sesión. Código: ' + err.status;
        this.cargando = false;
      }
    });
  } 
}
