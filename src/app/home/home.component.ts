import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { HttpClient } from '@angular/common/http';

interface Testimonio {
  autor: string;
  texto: string;
  fotoUrl: string;
}

interface Filtro {
  marca: string;
  modelo: string;
  precioMin: number;
  precioMax: number;
  anioMin: number;
  anioMax: number;
}

interface CocheDestacado {
  id: number;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  sesionIniciada = false;
  usuarioNombre = '';
  totalVehiculos = 0;
  totalUsuarios = 0;

  filtros: Filtro = {
    marca: '',
    modelo: '',
    precioMin: 0,
    precioMax: 100000,
    anioMin: 2000,
    anioMax: new Date().getFullYear()
  };

  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  testimonios: Testimonio[] = [];
  cochesDestacados: CocheDestacado[] = [];
  private apiUrl = 'http://localhost:3000/api';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.verificarSesion();
    this.cargarEstadisticas();
    this.cargarMarcas();
    this.cargarTestimonios();
    this.cargarCochesDestacados();
  }

  verificarSesion(): void {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    this.sesionIniciada = !!token;
    
    if (usuario) {
      try {
        const usuarioObj = JSON.parse(usuario);
        this.usuarioNombre = usuarioObj.nombre || '';
      } catch (error) {
        console.error('Error al analizar datos del usuario:', error);
      }
    }
  }

  irRuta(path: string): void {
    // Verificar si el usuario intenta acceder a anuncios o publicar sin estar autenticado
    if ((path === '/anuncios' || path === '/publicar') && !this.sesionIniciada) {
      // Redirigir al login si intenta acceder a anuncios o publicar sin estar autenticado
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate([path]);
  }

  aplicarFiltros(): void {
    // Verificar si el usuario está autenticado antes de aplicar filtros
    if (!this.sesionIniciada) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.router.navigate(['/vehiculos'], {
      queryParams: this.filtros
    });
  }

  private cargarEstadisticas(): void {
    this.http.get<{ totalVehiculos: number; totalUsuarios: number }>(`${this.apiUrl}/`)
      .subscribe(data => {
        this.totalVehiculos = data.totalVehiculos;
        this.totalUsuarios = data.totalUsuarios;
      });
  }

  private cargarMarcas(): void {
    this.http.get<string[]>(`${this.apiUrl}/catalogos/marcas`)
      .subscribe(marcas => this.marcasDisponibles = marcas);
  }

  cargarModelos(): void {
    if (this.filtros.marca) {
      this.http.get<string[]>(`${this.apiUrl}/catalogos/modelos?marca=${this.filtros.marca}`)
        .subscribe(modelos => this.modelosDisponibles = modelos);
    } else {
      this.filtros.modelo = '';
      this.modelosDisponibles = [];
    }
  }

  private cargarTestimonios(): void {
    this.http.get<Testimonio[]>(`${this.apiUrl}/testimonios`)
      .subscribe(testimonios => this.testimonios = testimonios);
  }

  private cargarCochesDestacados(): void {
    this.cochesDestacados = [
      { id: 1, titulo: 'BMW Serie 3', descripcion: 'Perfecto estado, listo para usar.', imagenUrl: '/assets/car-placeholder.jpg' },
      { id: 2, titulo: 'Audi A4', descripcion: 'Con todas las revisiones al día.', imagenUrl: '/assets/car-placeholder2.jpg' },
      { id: 3, titulo: 'Mercedes-Benz Clase C', descripcion: 'Excelente oportunidad, bajo kilometraje.', imagenUrl: '/assets/car-placeholder3.jpg' }
    ];
  }

  limpiarFiltros(): void {
    this.filtros = {
      marca: '',
      modelo: '',
      precioMin: 0,
      precioMax: 100000,
      anioMin: 2000,
      anioMax: new Date().getFullYear()
    };
    this.modelosDisponibles = [];
  }

  // Añadir esta propiedad
  marcasPopulares = [
    { nombre: 'Toyota', logo: 'assets/logos/toyota.png', busquedas: 1245 },
    { nombre: 'BMW', logo: 'assets/logos/bmw.png', busquedas: 1120 },
    { nombre: 'Mercedes', logo: 'assets/logos/mercedes.png', busquedas: 980 },
    { nombre: 'Audi', logo: 'assets/logos/audi.png', busquedas: 875 },
    { nombre: 'Volkswagen', logo: 'assets/logos/volkswagen.png', busquedas: 760 }
  ];
  
  // Añadir este método
  buscarPorMarca(marca: string) {
    // Redirigir a la página de búsqueda con la marca seleccionada
    this.router.navigate(['/anuncios'], { queryParams: { marca: marca } });
  }
}

