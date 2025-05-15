// perfil.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, NavComponent, FooterComponent, CommonModule]
})
export class PerfilComponent implements OnInit {
  perfilForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: any;
  updateSuccessMessage: string = '';
  updateErrorMessage: string = '';
  isLoading: boolean = false;
  isPasswordChanging: boolean = false;
  private userId: number | null = null;
  
  // Variables para la gestión de imágenes
  selectedFile: File | null = null;
  profileImageUrl: string | null = null;

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.perfilForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['']
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.obtenerUsuarioActual();
  }
  
  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { 'passwordMismatch': true };
  }

  obtenerUsuarioActual(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const usuarioObj = JSON.parse(usuario);
        this.userId = usuarioObj.id;
        if (this.userId !== null) {
          this.loadUserProfile(this.userId);
        } else {
          this.updateErrorMessage = 'No se pudo obtener el ID del usuario.';
        }
      } catch (error) {
        console.error('Error al analizar datos del usuario:', error);
        this.updateErrorMessage = 'Error al obtener información del usuario.';
      }
    } else {
      this.updateErrorMessage = 'Debes iniciar sesión para ver tu perfil.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  async loadUserProfile(userId: number): Promise<void> {
    this.isLoading = true;
    this.updateErrorMessage = '';
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        this.updateErrorMessage = 'No hay sesión activa. Por favor, inicia sesión nuevamente.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
        return;
      }
  
      // Verificar token para depuración
      console.log('Token disponible:', token ? 'Sí' : 'No');
      if (token) {
        console.log('Token (primeros 20 caracteres):', token.substring(0, 20) + '...');
      }
      
      console.log('Intentando cargar perfil para usuario ID:', userId);
  
      // Usar la ruta de usuarios en lugar de perfil
      const response = await fetch(`http://localhost:3000/api/usuarios/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error de respuesta:', response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.currentUser = await response.json();
      this.perfilForm.patchValue({
        nombre: this.currentUser.nombre,
        correo: this.currentUser.correo,
        telefono: this.currentUser.telefono || ''
      });
      
      // Establecer la URL de la imagen de perfil si existe
      this.profileImageUrl = this.currentUser.foto || null;
      
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error al cargar el perfil del usuario:', error);
      this.updateErrorMessage = 'Error al cargar la información del perfil.';
      this.isLoading = false;
    }
  }
  
  // Método para manejar la selección de archivos
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.perfilForm.valid && this.userId !== null) {
      this.isLoading = true;
      this.updateSuccessMessage = '';
      this.updateErrorMessage = '';

      try {
        // Primero subimos la imagen si se ha seleccionado una
        let fotoUrl = this.currentUser?.foto || '';
        
        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('imagen', this.selectedFile);
          
          const uploadResponse = await fetch(`http://localhost:3000/api/usuarios/${this.userId}/foto`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Error al subir la imagen');
          }
          
          const uploadResult = await uploadResponse.json();
          fotoUrl = uploadResult.url;
        }
        
        // Luego actualizamos el resto de la información del perfil
        const updatedData = {
          ...this.perfilForm.value,
          foto: fotoUrl
        };

        const response = await fetch(`http://localhost:3000/api/usuarios/${this.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Perfil actualizado:', responseData);
        this.updateSuccessMessage = responseData.mensaje || 'Perfil actualizado con éxito.';
        this.isLoading = false;
        
        // Actualizar información en localStorage
        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
        usuarioActual.nombre = updatedData.nombre;
        usuarioActual.correo = updatedData.correo;
        usuarioActual.telefono = updatedData.telefono;
        usuarioActual.foto = fotoUrl;
        localStorage.setItem('usuario', JSON.stringify(usuarioActual));
        
        // Limpiar el archivo seleccionado
        this.selectedFile = null;
      } catch (error: any) {
        console.error('Error al actualizar el perfil:', error);
        this.updateErrorMessage = error.message || 'Error al actualizar el perfil.';
        this.isLoading = false;
      }
    } else {
      this.updateErrorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }
  
  async onPasswordSubmit(): Promise<void> {
    if (this.passwordForm.valid && this.userId !== null) {
      this.isPasswordChanging = true;
      this.updateSuccessMessage = '';
      this.updateErrorMessage = '';
      
      try {
        const passwordData = {
          passwordActual: this.passwordForm.value.currentPassword,
          passwordNueva: this.passwordForm.value.newPassword
        };
        
        const response = await fetch(`http://localhost:3000/api/perfil/${this.userId}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(passwordData)
        });
        
        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        this.updateSuccessMessage = responseData.mensaje || 'Contraseña actualizada con éxito.';
        this.passwordForm.reset();
        this.isPasswordChanging = false;
      } catch (error: any) {
        console.error('Error al cambiar la contraseña:', error);
        this.updateErrorMessage = error.message || 'Error al cambiar la contraseña.';
        this.isPasswordChanging = false;
      }
    } else {
      this.updateErrorMessage = 'Por favor, completa todos los campos correctamente.';
    }
  }
}