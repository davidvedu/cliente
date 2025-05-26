import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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

@Component({
  selector: 'app-publicar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, NavComponent, FooterComponent],
  templateUrl: './publicar.component.html',
})
export class PublicarComponent implements OnInit {
  publicarForm: FormGroup;
  isSubmitting = false;

  marcas: Marca[] = [];
  modelos: Modelo[] = [];

  imagenPrincipalFile: File | null = null;
  imagenesAdicionalesFiles: File[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.publicarForm = this.fb.group({
      titulo: ['', Validators.required],
      matricula: ['', Validators.required],
      marca_id: [null, Validators.required],
      modelo_id: [null, Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      anio: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      kilometraje: ['', [Validators.required, Validators.min(0)]],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarMarcas();
  }

  cargarMarcas(): void {
    this.http.get<Marca[]>('http://localhost:3000/api/marcas').subscribe({
      next: (data) => {
        this.marcas = data;
      },
      error: (err) => {
        console.error('Error al cargar marcas', err);
      }
    });
  }

  onMarcaChange(): void {
    const marcaId = this.publicarForm.value.marca_id;
    this.publicarForm.patchValue({ modelo_id: null });
    this.modelos = [];

    if (marcaId) {
      this.http.get<Modelo[]>(`http://localhost:3000/api/modelos?marca_id=${marcaId}`).subscribe({
        next: (data) => {
          this.modelos = data;
        },
        error: (err) => {
          console.error('Error al cargar modelos', err);
        }
      });
    }
  }

  onPrincipalImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagenPrincipalFile = input.files[0];
    }
  }

  onAdicionalImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagenesAdicionalesFiles = Array.from(input.files);
    }
  }

  onSubmit(): void {
    if (this.publicarForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;

    const formData = new FormData();
    const valores = this.publicarForm.value;

    Object.entries(valores).forEach(([key, value]) => {
      if (typeof value === 'number' || typeof value === 'string') {
        formData.append(key, String(value));
      }
    });

    if (this.imagenPrincipalFile) {
      formData.append('imagen_principal', this.imagenPrincipalFile);
    }

    this.imagenesAdicionalesFiles.forEach(file => {
      formData.append('imagenes_adicionales', file);
    });

    this.http.post('http://localhost:3000/api/anuncios', formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Anuncio publicado con éxito');
        this.publicarForm.reset();
        this.imagenPrincipalFile = null;
        this.imagenesAdicionalesFiles = [];
      },
      error: (error) => {
        console.error('Error al publicar el anuncio:', error);
        this.isSubmitting = false;
        alert('Hubo un error al publicar el anuncio. Inténtalo de nuevo.');
      }
    });
  }
}
