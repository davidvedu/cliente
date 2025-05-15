import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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

  // Formulario de contacto
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
    if (!this.id) {
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

    // En un caso real, aquí harías la petición al backend
    // this.http.get<Anuncio>(`http://localhost:3000/api/anuncios/${this.id}`)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (data) => {
    //       this.anuncio = data;
    //       this.cargando = false;
    //     },
    //     error: (err) => {
    //       this.error = 'Error al cargar el anuncio';
    //       this.cargando = false;
    //     }
    //   });
    
    // Por ahora, usamos datos de ejemplo
    this.cargarDatoEjemplo();
  }

  cargarDatoEjemplo(): void {
    // Simulamos la carga de un anuncio específico
    const anuncios = [
      {
        id: 1,
        titulo: 'Audi A3 Sportback 2.0 TDI',
        descripcion: 'Vehiculo en perfecto estado, unico dueno, libro de mantenimiento al dia, ITV recien pasada. Equipado con climatizador bizona, control de crucero, sensores de aparcamiento, navegador, bluetooth, llantas de aleacion, faros LED, etc. Revision recien hecha con cambio de aceite y filtros. Neumaticos en buen estado.',
        precio: 15000,
        kilometros: 120000,
        anio: 2018,
        marca: 'Audi',
        modelo: 'A3 Sportback',
        combustible: 'Diesel',
        estado: 'Usado',
        ubicacion: 'Madrid',
        imagenes: ['assets/oferta1.webp', 'assets/coche1-2.jpg', 'assets/coche1-3.jpg'],
        vendedor: {
          id: 1,
          nombre: 'Carlos Rodriguez',
          valoracion: 4.8,
          foto: 'assets/user1.jpg'
        },
        fechaPublicacion: new Date('2023-12-15'),
        potencia: 150,
        cilindrada: 1968,
        cambio: 'Manual',
        puertas: 5,
        plazas: 5,
        color: 'Gris metalizado',
        equipamiento: ['Climatizador', 'Navegador', 'Bluetooth', 'Sensores de aparcamiento', 'Faros LED', 'Llantas de aleación'],
        garantia: true,
        itv: new Date('2024-12-15'),
        consumo: {
          urbano: 5.2,
          extraurbano: 3.8,
          mixto: 4.3
        },
        emisiones: 114,
        seguro: {
          tipo: 'Todo riesgo',
          vence: new Date('2024-06-15')
        },
        financiacion: true,
        precioFinanciado: 16500,
        cuotaMensual: 275
      }
    ];
    
    const anuncioEncontrado = anuncios.find(a => a.id === Number(this.id));
    if (!anuncioEncontrado) {
      this.error = 'Anuncio no encontrado';
      this.cargando = false;
      return;
    }
    
    this.anuncio = anuncioEncontrado;
    this.cargando = false;
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

    // En un caso real, aquí enviarías el mensaje al backend
    // this.http.post(`http://localhost:3000/api/mensajes`, {
    //   anuncio_id: this.anuncio.id,
    //   receptor_id: this.anuncio.vendedor.id,
    //   contenido: this.contactoForm.mensaje,
    //   nombre: this.contactoForm.nombre,
    //   email: this.contactoForm.email,
    //   telefono: this.contactoForm.telefono
    // }).pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.mostrarContacto = false;
    //       this.resetFormularioContacto();
    //       this.mensajeEnviado = true;
    //       this.enviandoMensaje = false;
    //     },
    //     error: (err) => {
    //       this.error = 'Error al enviar el mensaje';
    //       this.enviandoMensaje = false;
    //     }
    //   });

    // Simulamos el envío exitoso
    setTimeout(() => {
      this.mostrarContacto = false;
      this.resetFormularioContacto();
      this.mensajeEnviado = true;
      this.enviandoMensaje = false;
    }, 1000);
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

  volverAAnuncios(): void {
    this.router.navigate(['/anuncios']);
  }
}
