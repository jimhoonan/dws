import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PhotoData } from './models/photo-data.model';
import { Observable, map, of } from 'rxjs';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class PhotosService {
  private BaseUrl: string = 'https://stlaketravisdws.blob.core.windows.net/photos/';

  private photoData: PhotoData[] | null = null;

  constructor(private http: HttpClient) { }

  public getPhotoUrl(id: string) : string {
    return `${this.BaseUrl}photos/${id}.jpg`;
  }

  public getThumbnailUrl(id: string) : string {
    return `${this.BaseUrl}thumbnails/${id}.jpg`;
  }

  public getPhotoData(overlapRadius: number) : Observable<Map<number,PhotoData[]>> {
    if (!this.photoData) {
      return this.http.get('../assets/photos.json').pipe(
        map((value:any) => {
        this.photoData = value;
        return this.buildPhotoGroups(value, overlapRadius);
      }))
    }
    else {
      return of(this.buildPhotoGroups(this.photoData!, overlapRadius));
    }
  }

  private buildPhotoGroups(photoData: PhotoData[], overlapRadius: number) : Map<number, PhotoData[]> {
    var groupLookup = new Map<PhotoData, number>();
    var groupIndex = 0;

    for(let i = 0; i < photoData.length; i++) {
      if (!groupLookup.has(photoData[i])) {
        groupLookup.set(photoData[i], groupIndex);
        groupIndex++;
      }
      let currentGroup = groupLookup.get(photoData[i]);

      for(let j = i + 1; j < photoData.length; j++) {
        if (photoData[i].latitude && photoData[i].longitude && photoData[j].latitude && photoData[j].longitude)
        {

          let coordi = L.latLng(photoData[i].latitude, photoData[i].longitude);
          let coordj = L.latLng(photoData[j].latitude, photoData[j].longitude);

          if (coordi.distanceTo(coordj) < overlapRadius) {
            if (groupLookup.has(photoData[j])) {
              groupLookup.forEach((value: number, key: PhotoData) => {
                if (value === currentGroup) {
                  groupLookup.set(key, groupLookup.get(photoData[j])!)
                }
              })
            } else {
              groupLookup.set(photoData[j], groupLookup.get(photoData[i])!);
            }
          }
        }
      }
    }

    const groups = new Map<number, PhotoData[]>();

    for (const [key, value] of groupLookup.entries()) {
      if (groups.has(value)) {
        groups.get(value)!.push(key);
      } else {
        groups.set(value, [key]);
      }
    }

    return groups;
  }

}
