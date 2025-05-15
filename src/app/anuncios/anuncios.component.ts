import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpParams, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';

interface Anuncio {
  id: number;
  marca: string;
  modelo: string;
  precio: number;
  anio: number;
  kilometros: number;
  combustible: string;
  imagen_principal?: string;
  imagenes_adicionales?: string[];
  titulo?: string;
  ubicacion?: string;
  descripcion?: string;
}

interface Marca {
  id: number;
  nombre: string;
}

interface Filtros {
  marca: number | null;
  modelo: string;
  precioMin: number;
  precioMax: number;
  anioMin: number;
  anioMax: number;
  combustible: string;
  kilometrosMin: number;
  kilometrosMax: number;
}

interface Modelo {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-anuncios',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    NavComponent,
    FooterComponent
  ],
  templateUrl: './anuncios.component.html',
  styleUrl: './anuncios.component.css'
})
export class AnunciosComponent implements OnInit {

  filtros: Filtros = {
    marca: null,
    modelo: '',
    precioMin: 0,
    precioMax: 100000,
    anioMin: 2000,
    anioMax: new Date().getFullYear(),
    combustible: '',
    kilometrosMin: 0,
    kilometrosMax: 300000
  };

  marcas: Marca[] = [];
  modelos: { [marcaId: number]: Modelo[] } = {};
  combustibles: string[] = [];

  anuncios: any[] = [];
  anunciosFiltrados: any[] = [];
  cargando: boolean = false;
  error: string | null = null;
  favoritos: number[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay token, redirigir al login
      this.router.navigate(['/login']);
      return;
    }

    this.cargarMarcas();
    this.cargarCombustibles();
    this.obtenerAnuncios();
    this.cargarFavoritos();
  }

  cargarMarcas(): void {
    this.http.get<Marca[]>('http://localhost:3000/api/marcas').subscribe({
      next: (data) => {
        this.marcas = data;
        console.log('Marcas cargadas:', this.marcas);
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
      }
    });
  }

  onMarcaChange(): void {
    console.log('Marca seleccionada (id):', this.filtros.marca);
    this.filtros.modelo = '';

    if (this.filtros.marca !== null) {
      this.cargarModelos();
    }
  }


  cargarModelos(): void {
    if (this.filtros.marca === null) {
      this.filtros.modelo = '';
      return;
    }

    console.log(`Cargando modelos para la marca_id: ${this.filtros.marca}`);

    this.http
      .get<Modelo[]>(`http://localhost:3000/api/modelos?marca_id=${this.filtros.marca}`)
      .subscribe({
        next: (modelos) => {
          this.modelos[this.filtros.marca!] = modelos;
          console.log('Modelos cargados:', modelos);
        },
        error: (error) => {
          console.error(`Error al cargar modelos:`, error);
          this.modelos[this.filtros.marca!] = [];
        }
      });
  }

  getModelos(): Modelo[] {
    if (this.filtros.marca == null) return [];
    return this.modelos[this.filtros.marca] || [];
  }


  cargarCombustibles(): void {
    this.http.get<string[]>('http://localhost:3000/api/combustibles').subscribe({
      next: (data) => {
        this.combustibles = data;
        console.log('Combustibles cargados:', this.combustibles);
      },
      error: (err) => {
        console.error('Error al cargar combustibles:', err);
      }
    });
  }

  obtenerAnuncios(): void {
    this.cargando = true;
    this.error = null;

    // Configurar los headers con el token de autenticación
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    this.http.get<any[]>('http://localhost:3000/api/anuncios', { headers })
      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.anuncios = data;
            this.anunciosFiltrados = [...this.anuncios];
            console.log('Anuncios cargados:', this.anuncios);
          } else {
            console.log('No se encontraron anuncios:', data);
            this.anuncios = [];
            this.anunciosFiltrados = [];
            this.error = 'No se encontraron anuncios disponibles.';
          }
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar anuncios:', err);
          this.error = 'Error al cargar los anuncios. Por favor, intenta de nuevo más tarde.';
          this.cargando = false;
          this.anuncios = [];
          this.anunciosFiltrados = [];
        }
      });
  }

  aplicarFiltros(): void {
    this.cargando = true;

    let params = new HttpParams();

    if (this.filtros.marca) {
      params = params.append('marca_id', this.filtros.marca.toString());
    }
    if (this.filtros.modelo) {
      params = params.append('modelo_id', this.filtros.modelo);
    }
    if (this.filtros.precioMin > 0) {
      params = params.append('precio_min', this.filtros.precioMin.toString());
    }
    if (this.filtros.precioMax < 100000) {
      params = params.append('precio_max', this.filtros.precioMax.toString());
    }
    if (this.filtros.anioMin > 2000) {
      params = params.append('anio_min', this.filtros.anioMin.toString());
    }
    if (this.filtros.anioMax < new Date().getFullYear()) {
      params = params.append('anio_max', this.filtros.anioMax.toString());
    }
    if (this.filtros.combustible) {
      params = params.append('combustible', this.filtros.combustible);
    }
    if (this.filtros.kilometrosMin > 0) {
      params = params.append('km_min', this.filtros.kilometrosMin.toString());
    }
    if (this.filtros.kilometrosMax < 300000) {
      params = params.append('km_max', this.filtros.kilometrosMax.toString());
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    this.http.get<any[]>('http://localhost:3000/api/filtros', { params, headers })
      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.anuncios = data;
            this.anunciosFiltrados = [...this.anuncios];
          } else {
            this.anuncios = [];
            this.anunciosFiltrados = [];
            this.error = 'No se encontraron anuncios con los filtros aplicados.';
          }
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al filtrar anuncios:', err);
          this.error = 'Error al aplicar los filtros. Por favor, intenta de nuevo.';
          this.cargando = false;
        }
      });
  }


  limpiarFiltros(): void {
    this.filtros = {
      marca: null,
      modelo: '',
      precioMin: 0,
      precioMax: 100000,
      anioMin: 2000,
      anioMax: new Date().getFullYear(),
      combustible: '',
      kilometrosMin: 0,
      kilometrosMax: 300000
    };

    this.obtenerAnuncios();
  }

  // Método auxiliar para formatear URLs de imágenes
  public formatearUrlImagen(url?: string): string {
    if (!url) return 'assets/default-car.jpg';

    if (!url.startsWith('http') && !url.startsWith('assets')) {
      return `http://localhost:3000/uploads/${url}`;
    }

    return url;
  }


  verDetalle(id: number): void {
    this.router.navigate(['/detalle-vehiculo', id]);
  }

  formatearPrecio(precio: number | undefined): string {
    return (typeof precio === 'number') ? `${precio.toLocaleString('es-ES')} €` : '';
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/default-car.jpg';
  }

  toggleFavorito(anuncioId: number): void {
    const index = this.favoritos.indexOf(anuncioId);
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    if (!token || !usuario) {
      alert('Debes iniciar sesión para guardar favoritos');
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    if (index === -1) {
      // Añadir a favoritos usando la ruta actualizada con :anuncioId
      this.http.post(`http://localhost:3000/api/favoritos/${anuncioId}`, {}, { headers }).subscribe({
        next: (response) => {
          console.log('Anuncio guardado en favoritos:', response);
          this.favoritos.push(anuncioId);
          localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        },
        error: (err) => {
          console.error('Error al guardar favorito:', err);
        }
      });

    } else {
      // Eliminar favorito, suponiendo que el backend espera el ID del favorito (no el anuncio)
      // Para esto necesitas tener el ID del favorito, no solo el del anuncio.
      // Aquí vamos a asumir temporalmente que ID del favorito == ID del anuncio (ajusta si no es así)

      this.http.delete(`http://localhost:3000/api/favoritos/${anuncioId}`, { headers }).subscribe({
        next: (response) => {
          console.log('Anuncio eliminado de favoritos:', response);
          this.favoritos.splice(index, 1);
          localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        },
        error: (err) => {
          console.error('Error al eliminar favorito:', err);
        }
      });
    }
  }


  cargarFavoritos(): void {
    const token = localStorage.getItem('token');

    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('http://localhost:3000/api/favoritos', { headers }).subscribe({
      next: (data) => {
        this.favoritos = data.map(fav => fav.anuncio_id);
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
      },
      error: (err) => {
        console.error('Error al cargar favoritos:', err);
      }
    });
  }



  esFavorito(anuncioId: number): boolean {
    return this.favoritos.includes(anuncioId);
  }

}
