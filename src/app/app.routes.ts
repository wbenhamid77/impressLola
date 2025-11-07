import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardLocataireComponent } from './components/dashboard-locataire/dashboard-locataire.component';
import { DashboardLocateurComponent } from './components/dashboard-locateur/dashboard-locateur.component';
import { AjouterAnnonceComponent } from './components/ajouter-annonce/ajouter-annonce.component';
import { MesAnnoncesComponent } from './components/mes-annonces/mes-annonces.component';
import { ModifierAnnonceComponent } from './components/modifier-annonce/modifier-annonce.component';
import { AnnoncesComponent } from './components/annonces/annonces.component';
import { DetailAnnonceComponent } from './components/detail-annonce/detail-annonce.component';
import { MesFavorisComponent } from './components/mes-favoris/mes-favoris.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ReservationsLocataireComponent } from './components/reservation-locataire/reservations-locataire.component';
import { ReservationsLocateurComponent } from './components/reservation-locateur/reservations-locateur.component';
import { ReservationDetailComponent } from './components/reservation-detail/reservation-detail.component';
import { PageReservationComponent } from './components/page-reservation/page-reservation.component';
import { CarteInteractiveComponent } from './components/carte-interactive/carte-interactive.component';
import { PaiementsLocateurComponent } from './components/paiements-locateur/paiements-locateur.component';
import { PaiementsLocataireComponent } from './components/paiements-locataire/paiements-locataire.component';
import { FinancesLocateurComponent } from './components/finances-locateur/finances-locateur.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent }, // Dashboard principal (redirection)
      { path: 'dashboard-locataire', component: DashboardLocataireComponent },
      { path: 'dashboard-locateur', component: DashboardLocateurComponent },
      { path: 'ajouter-annonce', component: AjouterAnnonceComponent },
      { path: 'mes-annonces', component: MesAnnoncesComponent },
      { path: 'modifier-annonce/:id', component: ModifierAnnonceComponent },
      { path: 'annonces', component: AnnoncesComponent },
      { path: 'detail-annonce/:id', component: DetailAnnonceComponent },
      { path: 'mes-favoris', component: MesFavorisComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'mes-reservations', component: ReservationsLocataireComponent },
      { path: 'reservations-locateur', component: ReservationsLocateurComponent },
      { path: 'reservation/:id', component: ReservationDetailComponent },
      { path: 'reserver/:id', component: PageReservationComponent },
      { path: 'carte-interactive', component: CarteInteractiveComponent },
      { path: 'paiements-locateur', component: PaiementsLocateurComponent },
      { path: 'paiements-locataire', component: PaiementsLocataireComponent },
      { path: 'finances-locateur', component: FinancesLocateurComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
