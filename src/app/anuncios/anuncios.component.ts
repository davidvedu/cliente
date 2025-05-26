import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { HttpClient, HttpClientModule, HttpParams, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';

interface Marca {
  id: number;
  nombre: string;
}

interface Modelo {
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
  styleUrls: ['./anuncios.component.css']
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

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute,) {
      this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd && this.router.url.includes('/anuncios')) {
      this.cargarFavoritos();
    }
  });
   }

async ngOnInit(): Promise<void> {
  const token = localStorage.getItem('token');
  console.log('Token al iniciar:', token);

  if (!token) {
    this.router.navigate(['/login']);
    return;
  }

  this.cargarMarcas();
  this.cargarCombustibles();

  await this.cargarFavoritos(); 
  this.obtenerAnuncios();
}


  cargarMarcas(): void {
    this.http.get<Marca[]>('http://localhost:3000/api/marcas').subscribe({
      next: (data) => (this.marcas = data),
      error: (err) => console.error('Error al cargar marcas:', err)
    });
  }

  cargarModelos(): void {
    if (this.filtros.marca === null) return;

    this.http
      .get<Modelo[]>(`http://localhost:3000/api/modelos?marca_id=${this.filtros.marca}`)
      .subscribe({
        next: (modelos) => (this.modelos[this.filtros.marca!] = modelos),
        error: (error) => {
          console.error('Error al cargar modelos:', error);
          this.modelos[this.filtros.marca!] = [];
        }
      });
  }

  getModelos(): Modelo[] {
    return this.filtros.marca ? this.modelos[this.filtros.marca] || [] : [];
  }

cargarFavoritos(): Promise<void> {
  return new Promise((resolve, reject) => {
    const usuario = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    console.log('Cargando favoritos - Usuario:', usuario, 'Token:', token);

    if (!usuario || !token) {
      resolve();
      return;
    }

    const usuarioId = JSON.parse(usuario).id;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http
      .get<any[]>(`http://localhost:3000/api/usuarios/${usuarioId}/favoritos`, { headers })
      .subscribe({
        next: (data) => {
          console.log('Favoritos recibidos del backend:', data);
          this.favoritos = Array.isArray(data) ? data.map(f => f.anuncio_id) : [];
          console.log('IDs de anuncios favoritos:', this.favoritos);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar favoritos:', error);
          resolve();
        }
      });
  });
}


  cargarCombustibles(): void {
    this.http.get<string[]>('http://localhost:3000/api/combustibles').subscribe({
      next: (data) => (this.combustibles = data),
      error: (err) => console.error('Error al cargar combustibles:', err)
    });
  }
  
async obtenerAnuncios(): Promise<void> {
  this.cargando = true;
  this.error = null;

  try {
    await this.cargarFavoritos(); // <-- Esto garantiza que la lista esté actualizada
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });

    this.http.get<any[]>('http://localhost:3000/api/anuncios', { headers }).subscribe({
      next: (data) => {
        this.anuncios = data || [];
        this.anunciosFiltrados = [...this.anuncios];
        this.cargando = false;

        if (this.anuncios.length === 0) {
          this.error = 'No se encontraron anuncios disponibles.';
        }
      },
      error: (err) => {
        console.error('Error al cargar anuncios:', err);
        this.error = 'Error al cargar los anuncios.';
        this.anuncios = [];
        this.anunciosFiltrados = [];
        this.cargando = false;
      }
    });
  } catch (err) {
    console.error('Error inesperado:', err);
    this.cargando = false;
  }
}


  aplicarFiltros(): void {
    this.cargando = true;

    let params = new HttpParams();

    if (this.filtros.marca) params = params.append('marca_id', this.filtros.marca.toString());
    if (this.filtros.modelo) params = params.append('modelo_id', this.filtros.modelo);
    if (this.filtros.precioMin > 0) params = params.append('precio_min', this.filtros.precioMin.toString());
    if (this.filtros.precioMax < 100000) params = params.append('precio_max', this.filtros.precioMax.toString());
    if (this.filtros.anioMin > 2000) params = params.append('anio_min', this.filtros.anioMin.toString());
    if (this.filtros.anioMax < new Date().getFullYear()) params = params.append('anio_max', this.filtros.anioMax.toString());
    if (this.filtros.combustible) params = params.append('combustible', this.filtros.combustible);
    if (this.filtros.kilometrosMin > 0) params = params.append('km_min', this.filtros.kilometrosMin.toString());
    if (this.filtros.kilometrosMax < 300000) params = params.append('km_max', this.filtros.kilometrosMax.toString());

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });

    this.http.get<any[]>('http://localhost:3000/api/filtros', { params, headers }).subscribe({
      next: (data) => {
        this.anuncios = data || [];
        this.anunciosFiltrados = [...this.anuncios];
        if (this.anuncios.length === 0) {
          this.error = 'No se encontraron anuncios con los filtros aplicados.';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al filtrar anuncios:', err);
        this.error = 'Error al aplicar los filtros.';
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

  formatearUrlImagen(url?: string): string {
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
    return typeof precio === 'number' ? `${precio.toLocaleString('es-ES')} €` : '';
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/default-car.jpg';
  }


toggleFavorito(anuncioId: number): void {
  const index = this.favoritos.indexOf(anuncioId);
  const token = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');

  console.log('Toggle favorito para anuncio:', anuncioId, 'Estado actual:', index !== -1);

  if (!token || !usuario) {
    alert('Debes iniciar sesión para guardar favoritos');
    this.router.navigate(['/login']);
    return;
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  if (index === -1) {
    console.log('Añadiendo a favoritos:', anuncioId);
    this.http.post(`http://localhost:3000/api/favoritos/${anuncioId}`, {}, { headers }).subscribe({
      next: () => {
        this.favoritos.push(anuncioId);
        console.log('Favorito añadido:', this.favoritos);
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
      },
      error: (err) => console.error('Error al guardar favorito:', err)
    });
  } else {
    console.log('Eliminando de favoritos:', anuncioId);
    this.http.delete(`http://localhost:3000/api/favoritos/anuncio/${anuncioId}`, { headers }).subscribe({
      next: () => {
        this.favoritos.splice(index, 1);
        console.log('Favorito eliminado:', this.favoritos);
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
      },
      error: (err) => console.error('Error al eliminar favorito:', err)
    });
  }
}

  onMarcaChange(): void {
    this.filtros.modelo = '';
    if (this.filtros.marca !== null) this.cargarModelos();
  }

esFavorito(anuncioId: number): boolean {
  return this.favoritos.includes(anuncioId);
}

}
