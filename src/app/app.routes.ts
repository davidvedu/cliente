import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./registro/registro.component').then(m => m.RegistroComponent) 
  },
  { 
    path: 'anuncios', 
    loadComponent: () => import('./anuncios/anuncios.component').then(m => m.AnunciosComponent) 
  },
  { 
    path: 'detalle-vehiculo/:id', 
    loadComponent: () => import('./detalle-vehiculo/detalle-vehiculo.component').then(m => m.DetalleVehiculoComponent) 
  },
  { 
    path: 'perfil', 
    loadComponent: () => import('./perfil/perfil.component').then(m => m.PerfilComponent) 
  },
  {
    path: 'publicar',
    loadComponent: () => import('./publicar/publicar.component').then(m => m.PublicarComponent) 
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./favoritos/favoritos.component').then(m => m.FavoritosComponent) 
  },
  {
    path: 'mensajes',
    loadComponent: () => import('./mensajes/mensajes.component').then(m => m.MensajesComponent) 
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];
