import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ZoneData } from './models/zone-data.model';

@Injectable({
  providedIn: 'root'
})
export class ZonesService {

  constructor(private http: HttpClient) { }
  private zoneData: ZoneData[] | null = null;


  public getZoneData() : Observable<ZoneData[]> {
    if (!this.zoneData) {
      return this.http.get<ZoneData[]>('../assets/zones.json').pipe(
        tap((data: ZoneData[]) => {
          this.zoneData = data;
        })
      );
    }
    else {
      return of(this.zoneData);
    }
  }
}
