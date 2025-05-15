import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';

interface Mensaje {
  id: number;
  emisor_id: number;
  receptor_id: number;
  anuncio_id: number;
  contenido: string;
  fecha_envio: string;
  leido: boolean;
  emisor: {
    id: number;
    nombre: string;
    foto: string;
  };
  receptor: {
    id: number;
    nombre: string;
    foto: string;
  };
  anuncio: {
    id: number;
    titulo: string;
    imagen_principal: string;
  };
}

interface NuevoMensaje {
  receptor_id: number;
  anuncio_id: number;
  contenido: string;
}

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    NavComponent,
    FooterComponent
  ],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css'
})
export class MensajesComponent implements OnInit {
  mensajesRecibidos: Mensaje[] = [];
  mensajesEnviados: Mensaje[] = [];
  cargando = true;
  error: string | null = null;
  usuarioId: number | null = null;
  
  // Para el formulario de nuevo mensaje
  nuevoMensaje: NuevoMensaje = {
    receptor_id: 0,
    anuncio_id: 0,
    contenido: ''
  };
  mostrarFormulario = false;

  // Para la vista de conversación
  conversacionActiva: Mensaje[] = [];
  usuarioConversacion: any = null;
  anuncioConversacion: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.obtenerUsuarioActual();
  }

  obtenerUsuarioActual(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const usuarioObj = JSON.parse(usuario);
        this.usuarioId = usuarioObj.id;
        this.cargarMensajes();
      } catch (error) {
        console.error('Error al analizar datos del usuario:', error);
        this.error = 'Error al obtener información del usuario.';
        this.cargando = false;
      }
    } else {
      this.error = 'Debes iniciar sesión para ver tus mensajes.';
      this.cargando = false;
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  cargarMensajes(): void {
    if (!this.usuarioId) {
      this.error = 'No se pudo obtener el ID del usuario.';
      this.cargando = false;
      return;
    }

    this.cargando = true;
    this.error = null;

    // Cargar mensajes recibidos
    this.http.get<Mensaje[]>(`http://localhost:3000/api/usuarios/${this.usuarioId}/mensajes/recibidos`).subscribe({
      next: (data) => {
        this.mensajesRecibidos = data;
        console.log('Mensajes recibidos cargados:', this.mensajesRecibidos.length);
        
        // Cargar mensajes enviados
        this.http.get<Mensaje[]>(`http://localhost:3000/api/usuarios/${this.usuarioId}/mensajes/enviados`).subscribe({
          next: (data) => {
            this.mensajesEnviados = data;
            console.log('Mensajes enviados cargados:', this.mensajesEnviados.length);
            this.cargando = false;
          },
          error: (err) => {
            this.error = 'Error al cargar los mensajes enviados.';
            console.error('Error al cargar mensajes enviados:', err);
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los mensajes recibidos.';
        console.error('Error al cargar mensajes recibidos:', err);
        this.cargando = false;
      }
    });
  }

  verConversacion(usuarioId: number, anuncioId: number): void {
    // Filtrar mensajes para esta conversación
    this.conversacionActiva = [
      ...this.mensajesRecibidos.filter(m => 
        (m.emisor_id === usuarioId && m.anuncio_id === anuncioId) || 
        (m.receptor_id === usuarioId && m.anuncio_id === anuncioId)
      ),
      ...this.mensajesEnviados.filter(m => 
        (m.emisor_id === usuarioId && m.anuncio_id === anuncioId) || 
        (m.receptor_id === usuarioId && m.anuncio_id === anuncioId)
      )
    ].sort((a, b) => new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime());

    // Obtener información del usuario y anuncio
    if (this.conversacionActiva.length > 0) {
      const primerMensaje = this.conversacionActiva[0];
      this.usuarioConversacion = primerMensaje.emisor_id === this.usuarioId ? primerMensaje.receptor : primerMensaje.emisor;
      this.anuncioConversacion = primerMensaje.anuncio;
      
      // Preparar para responder
      this.nuevoMensaje.receptor_id = this.usuarioConversacion.id;
      this.nuevoMensaje.anuncio_id = this.anuncioConversacion.id;
    }
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.contenido.trim()) {
      alert('El mensaje no puede estar vacío');
      return;
    }

    if (!this.usuarioId) {
      alert('Debes iniciar sesión para enviar mensajes');
      return;
    }

    const mensaje = {
      ...this.nuevoMensaje,
      emisor_id: this.usuarioId
    };

    this.http.post<Mensaje>('http://localhost:3000/api/mensajes', mensaje).subscribe({
      next: (data) => {
        console.log('Mensaje enviado correctamente:', data);
        this.nuevoMensaje.contenido = '';
        this.cargarMensajes();
        
        // Si estamos en una conversación, actualizar
        if (this.usuarioConversacion) {
          this.verConversacion(this.usuarioConversacion.id, this.anuncioConversacion.id);
        }
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        alert('Error al enviar el mensaje. Inténtalo de nuevo.');
      }
    });
  }

  marcarComoLeido(id: number): void {
    this.http.patch(`http://localhost:3000/api/mensajes/${id}/leer`, {}).subscribe({
      next: () => {
        // Actualizar estado en la lista local
        const mensaje = this.mensajesRecibidos.find(m => m.id === id);
        if (mensaje) {
          mensaje.leido = true;
        }
      },
      error: (err) => {
        console.error('Error al marcar mensaje como leído:', err);
      }
    });
  }

  eliminarMensaje(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
      this.http.delete(`http://localhost:3000/api/mensajes/${id}`).subscribe({
        next: () => {
          this.mensajesRecibidos = this.mensajesRecibidos.filter(m => m.id !== id);
          this.mensajesEnviados = this.mensajesEnviados.filter(m => m.id !== id);
          console.log('Mensaje eliminado correctamente');
          
          // Si estamos en una conversación, actualizar
          if (this.usuarioConversacion) {
            this.conversacionActiva = this.conversacionActiva.filter(m => m.id !== id);
          }
        },
        error: (err) => {
          console.error('Error al eliminar mensaje:', err);
          alert('Error al eliminar el mensaje. Inténtalo de nuevo.');
        }
      });
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES');
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/default-user.jpg';
  }

  handleAnuncioImageError(event: any): void {
    event.target.src = 'assets/default-car.jpg';
  }

  verAnuncio(id: number): void {
    this.router.navigate(['/detalle-vehiculo', id]);
  }
}
