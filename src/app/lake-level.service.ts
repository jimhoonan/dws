import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LakeLevelService {

  constructor(private http: HttpClient) { }

  private lakeLevel!: any[] | null;

  public getCurrentLakeLevel() : Observable<number> {
    return this.http.get('/api/lakelevel').pipe(
      map((x:any) => {
        if (x.level) {
          return Math.min(Math.max(Math.floor(x.level), 592),705)
        } else {
          return 630
        }
      })
    )
  }

  public getLakeLevel(timestamp: Date) : Observable<number> {
    if (!this.lakeLevel) {
      return this.http.get('../assets/lakelevels.json').pipe(map((value:any) => {
        this.lakeLevel = value;  
        var month = this.lakeLevel?.find((x: any) => {
          let date = new Date(x.date);
          date.setDate(date.getDate() + 1)
          return date.getMonth() === timestamp.getMonth() && date.getFullYear() === timestamp.getFullYear();
      });
        return Math.floor(month.level);
    }));
    }

    return of(this.lakeLevel?.find((x: any) => {
      let date = new Date(x.date);
      date.setDate(date.getDate() + 1)
      return date.getMonth() === timestamp.getMonth() && date.getFullYear() === timestamp.getFullYear();
    }));
  }
}
