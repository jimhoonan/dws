import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PhotoData } from './models/photo-data.model';
import { Observable, of, tap } from 'rxjs';

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

  public getPhotoData() : Observable<PhotoData[]> {
      if (!this.photoData) {
        return this.http.get('../assets/photos.json').pipe(
          tap((value:any) => {
          this.photoData = value;
        }))
      }
      else {
        return of(this.photoData);
      }
    }

}
