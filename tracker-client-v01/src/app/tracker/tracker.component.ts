import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import L, { LatLng } from 'leaflet';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { UserService } from '../_services/user.service';
import { LocationListComponent } from '../locationList/locationList.component';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { MessageService } from '../_services/message.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [MatButtonModule, LocationListComponent, AsyncPipe, CommonModule],
  templateUrl: './tracker.component.html',
  styleUrl: './tracker.component.css',
})
export class TrackerComponent {
  private map: L.Map | undefined = undefined;
  private marker: L.Marker | undefined = undefined;
  private location = new Observable<GeolocationCoordinates>((observer) => {
    window.navigator.geolocation.watchPosition(
      (position) => {
        console.log(position);
        observer.next(position.coords);
      },
      // observer.error puts observable into an error state. It means we can no longer emit any more values out of this observable
      (err) => observer.error(err)
    );
  })
    .pipe(
      tap((loc) => {
        this.map?.setView([loc.latitude, loc.longitude]);
        this.marker = new L.Marker(new LatLng(loc.latitude, loc.longitude));
        this.marker.addTo(this.map!);
        this.lat = loc.latitude;
        this.lon = loc.longitude;
      })
    )
    .subscribe();
  private lat: number = 39.8282;
  private lon: number = -98.5795;
  public locationsList$ = new BehaviorSubject<
    {
      latitude: number;
      longitude: number;
      time: string;
    }[]
  >([]);

  constructor(
    private userService: UserService,
    private messageService: MessageService
  ) {}

  private initMap(): void {
    this.map = L.map('map-tracker', {
      center: [this.lat, this.lon],
      zoom: 3,
      dragging: false,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);
  }

  async ngAfterViewInit(): Promise<void> {
    this.initMap();
    const response = await fetch(
      `https://127.0.0.1:3000/users/locations/${this.userService.user.uuid}`
    );
    const locations = await response.json();
    this.locationsList$.next(locations);
  }

  async storeLocation(): Promise<void> {
    const lat = this.lat;
    const lon = this.lon;
    try {
      await fetch('https://127.0.0.1:3000/users/location/', {
        method: 'POST',
        body: JSON.stringify({
          user_uuid: sessionStorage.getItem('uuid'),
          latitude: lat,
          longitude: lon,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.locationsList$.next([
        ...this.locationsList$.value,
        { latitude: lat, longitude: lon, time: new Date().toISOString() },
      ]);
    } catch (e) {
      this.messageService.add('Couldnt store location');
    }
  }
}
