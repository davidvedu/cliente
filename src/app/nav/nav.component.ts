import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  imports: [RouterModule, CommonModule, HttpClientModule]
})
export class NavComponent implements OnInit {
  usuarioActual: any = null;
  menuAbierto = false;
  rolActual: 'comprador' | 'vendedor' = 'comprador';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.verificarSesion();
  }

  verificarSesion(): void {
    const usuario = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    
    if (usuario && token) {
      try {
        this.usuarioActual = JSON.parse(usuario);
        this.rolActual = this.usuarioActual.rol || 'comprador';
    
        // Protección: si el rol es inválido o no existe
        if (!['comprador', 'vendedor'].includes(this.rolActual)) {
          this.rolActual = 'comprador';
        }
        
        console.log('Usuario autenticado:', this.usuarioActual);
        console.log('Rol actual:', this.rolActual);
      } catch (error) {
        console.error('Error al analizar datos del usuario:', error);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        this.usuarioActual = null;
      }
    } else {
      console.log('No hay sesión activa');
      this.usuarioActual = null;
    }
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cambiarRol(): void {
    const nuevoRol = this.rolActual === 'comprador' ? 'vendedor' : 'comprador';
    const token = localStorage.getItem('token');
  
    if (!token || !this.usuarioActual) {
      alert('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }
  
    this.http.put<any>(
      `http://localhost:3000/api/usuarios/${this.usuarioActual.id}/rol`,
      { rol: nuevoRol },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (res) => {
        this.rolActual = nuevoRol;
        this.usuarioActual.rol = nuevoRol;
        localStorage.setItem('usuario', JSON.stringify(this.usuarioActual));
        console.log('Rol cambiado exitosamente a:', nuevoRol);
        
        // Corregir la lógica de redirección
        const rutaDestino = nuevoRol === 'vendedor' ? '/publicar' : '/anuncios';
        this.router.navigate([rutaDestino]);
      },
      error: (err) => {
        console.error('Error al cambiar el rol:', err);
        const mensajeError = err.error?.mensaje || 'Error al cambiar el rol. Inténtalo de nuevo.';
        alert(mensajeError);
      }
    });
  }

  cerrarSesion(): void {
    const token = localStorage.getItem('token');

    this.http.post('http://localhost:3000/api/sesion/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: () => this.limpiarSesion(),
      error: () => this.limpiarSesion()
    });
  }

  private limpiarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual = null;
    this.router.navigate(['/']);
  }
}

