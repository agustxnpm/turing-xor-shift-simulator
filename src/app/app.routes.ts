import { Routes } from '@angular/router';
import { MaquinaTuringComponent } from './maquina-turing/maquina-turing.component';

export const routes: Routes = [
  { path: 'simulator', component: MaquinaTuringComponent },
  { path: '', redirectTo: '/simulator', pathMatch: 'full' },
  { path: '**', redirectTo: '/simulator' }
];
