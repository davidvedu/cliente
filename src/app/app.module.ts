// Este archivo no debería existir en Angular 19
// Angular 19 usa un enfoque standalone sin NgModules

// En su lugar, deberías tener:
// 1. app.config.ts - Para configuración de la aplicación
// 2. app.routes.ts - Para configuración de rutas
// 3. Componentes standalone

// Si necesitas mantener este archivo por compatibilidad con código existente:
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { AnunciosComponent } from './anuncios/anuncios.component';
import { DetalleVehiculoComponent } from './detalle-vehiculo/detalle-vehiculo.component';
import { FooterComponent } from './footer/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    LoginComponent,
    RegistroComponent,
    AnunciosComponent,
    DetalleVehiculoComponent,
    FooterComponent, 
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }