import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface Anuncio {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  kilometros: number;
  anio: number;
  marca: string;
  modelo: string;
  combustible: string;
  estado: string;
  ubicacion: string;
  imagenes: string[];
  vendedor: {
    id: number;
    nombre: string;
    valoracion: number;
    foto: string;
  };
  fechaPublicacion: Date;
  potencia: number;
  cilindrada: number;
  cambio: string;
  puertas: number;
  plazas: number;
  color: string;
  equipamiento: string[];
  garantia: boolean;
  itv: Date;
  consumo: {
    urbano: number;
    extraurbano: number;
    mixto: number;
  };
  emisiones: number;
  seguro: {
    tipo: string;
    vence: Date;
  };
  financiacion: boolean;
  precioFinanciado: number;
  cuotaMensual: number;
}

interface ContactoForm {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

@Component({
  selector: 'app-detalle-vehiculo',
  standalone: true,
  imports: [CommonModule, NavComponent, FooterComponent, FormsModule],
  templateUrl: './detalle-vehiculo.component.html',
  styleUrl: './detalle-vehiculo.component.css'
})
export class DetalleVehiculoComponent implements OnInit, OnDestroy {
  anuncio: Anuncio | null = null;
  id: string | null = null;
  imagenActual: number = 0;
  mostrarFinanciacion: boolean = false;
  mostrarContacto: boolean = false;
  cargando: boolean = true;
  error: string | null = null;
  enviandoMensaje: boolean = false;
  mensajeEnviado: boolean = false;

  contactoForm: ContactoForm = {
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id || isNaN(Number(this.id))) {
      this.error = 'ID de anuncio no válido';
      this.cargando = false;
      return;
    }
    this.cargarAnuncio();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarAnuncio(): void {
    this.cargando = true;
    this.error = null;
  
    // Agregar headers de autenticación si es necesario
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({
      'Authorization': `Bearer ${token}`
    }) : undefined;
  
    this.http.get<Anuncio>(`http://localhost:3000/api/anuncios/${this.id}`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.anuncio = {
            ...data,
            fechaPublicacion: new Date(data.fechaPublicacion),
            itv: new Date(data.itv),
            seguro: {
              ...data.seguro,
              vence: new Date(data.seguro.vence)
            }
          };
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar anuncio:', err);
          this.error = 'Error al cargar el anuncio. Puede que no exista o no tengas permisos para verlo.';
          this.cargando = false;
        }
      });
  }

  cambiarImagen(indice: number): void {
    if (this.anuncio && indice >= 0 && indice < this.anuncio.imagenes.length) {
      this.imagenActual = indice;
    }
  }

  siguienteImagen(): void {
    if (this.anuncio) {
      this.imagenActual = (this.imagenActual + 1) % this.anuncio.imagenes.length;
    }
  }

  anteriorImagen(): void {
    if (this.anuncio) {
      this.imagenActual = (this.imagenActual - 1 + this.anuncio.imagenes.length) % this.anuncio.imagenes.length;
    }
  }

  toggleFinanciacion(): void {
    this.mostrarFinanciacion = !this.mostrarFinanciacion;
  }

  toggleContacto(): void {
    this.mostrarContacto = !this.mostrarContacto;
    if (!this.mostrarContacto) {
      this.resetFormularioContacto();
    }
  }

  resetFormularioContacto(): void {
    this.contactoForm = {
      nombre: '',
      email: '',
      telefono: '',
      mensaje: ''
    };
    this.error = null;
    this.mensajeEnviado = false;
  }

  validarFormulario(): boolean {
    if (!this.contactoForm.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }

    if (!this.contactoForm.email.trim()) {
      this.error = 'El email es obligatorio';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactoForm.email)) {
      this.error = 'El email no es válido';
      return false;
    }

    if (this.contactoForm.telefono && !/^[0-9+\s-]{9,}$/.test(this.contactoForm.telefono)) {
      this.error = 'El teléfono no es válido';
      return false;
    }

    if (!this.contactoForm.mensaje.trim()) {
      this.error = 'El mensaje es obligatorio';
      return false;
    }

    return true;
  }

  enviarMensaje(): void {
    if (!this.anuncio) {
      this.error = 'No se puede enviar el mensaje sin un anuncio válido';
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    this.enviandoMensaje = true;
    this.error = null;

    this.http.post(`http://localhost:3000/api/mensajes`, {
      anuncio_id: this.anuncio.id,
      receptor_id: this.anuncio.vendedor.id,
      contenido: this.contactoForm.mensaje,
      nombre: this.contactoForm.nombre,
      email: this.contactoForm.email,
      telefono: this.contactoForm.telefono
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarContacto = false;
          this.resetFormularioContacto();
          this.mensajeEnviado = true;
          this.enviandoMensaje = false;
        },
        error: () => {
          this.error = 'Error al enviar el mensaje';
          this.enviandoMensaje = false;
        }
      });
  }

  calcularAntiguedad(): number {
    if (!this.anuncio) return 0;
    return new Date().getFullYear() - this.anuncio.anio;
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearPrecio(precio: number): string {
    return precio.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  formatearKilometros(kilometros: number): string {
    return kilometros.toLocaleString('es-ES') + ' km';
  }

  formatearConsumo(consumo: number): string {
    return `${consumo.toFixed(1)} l/100km`;
  }

  formatearEmisiones(emisiones: number): string {
    return `${emisiones} g/km`;
  }
}
