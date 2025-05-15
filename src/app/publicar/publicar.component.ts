import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-publicar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavComponent, FooterComponent],
  templateUrl: './publicar.component.html',
})
export class PublicarComponent {
  publicarForm: FormGroup;
  isSubmitting = false;

  marcasDisponibles = ['Toyota', 'Ford', 'Volkswagen', 'BMW'];
  modelosDisponibles: { [marca: string]: string[] } = {
    Toyota: ['Corolla', 'Yaris', 'RAV4'],
    Ford: ['Focus', 'Fiesta', 'Mustang'],
    Volkswagen: ['Golf', 'Polo', 'Passat'],
    BMW: ['Serie 1', 'Serie 3', 'Serie 5']
  };

  constructor(private fb: FormBuilder) {
    this.publicarForm = this.fb.group({
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      anio: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      kilometraje: ['', [Validators.required, Validators.min(0)]],
      descripcion: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.publicarForm.valid) {
      this.isSubmitting = true;
      const anuncio = this.publicarForm.value;

      // Aquí puedes hacer una llamada a tu servicio para guardar el anuncio
      console.log('Enviando anuncio:', anuncio);

      // Simulamos que terminó
      setTimeout(() => {
        this.isSubmitting = false;
        alert('Anuncio publicado con éxito');
        this.publicarForm.reset();
      }, 1000);
    }
  }
}