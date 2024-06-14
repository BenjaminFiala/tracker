import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { TrackerComponent } from './tracker/tracker.component';
import { loggedInGuard } from './_guards/logged-in.guard';
import { EmptyComponent } from './empty/empty.component';
import {LocationListComponent} from "./locationList/locationList.component";

export const routes: Routes = [
  { path: 'map', component: MapComponent },
  {
    path: 'tracker',
    component: TrackerComponent,
    canActivate: [loggedInGuard],
  },
  { path: '', component: EmptyComponent },
  { path: '**', component: AppComponent },
  { path: 'locations', component: LocationListComponent}
];
