import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Observable, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClimbScoreService implements OnInit {

  private geoJsonData: any;
  private featureCache: Map<number, any[]> = new Map<number, any[]>();
  private legendCache: Map<number, any[]> = new Map<number, any[]>();


  constructor(private http: HttpClient) { }

  ngOnInit(): void {

  }

  private fetchData(): Observable<any> {
    if (!this.geoJsonData) {
      return this.http.get('../assets/geojson/merged.geojson').pipe(
        tap(data => this.geoJsonData = data)
      )
    } else {
      return of(this.geoJsonData)
    }
  }

  getLevelData(lakeLevel: number) : Observable<any> {

    return this.fetchData().pipe(
      map(data => {
        let features;

        if (this.featureCache.has(this.getLevelBucket(lakeLevel))) {
          features = this.featureCache.get(this.getLevelBucket(lakeLevel));
        }
        else {
          features = this.geoJsonData.features
          .filter((feature : any) => lakeLevel <= feature.properties.level && feature.properties.level < lakeLevel + 3)
          .sort((a: any, b: any) => b.properties.Area - a.properties.Area);
    
          this.featureCache.set(this.getLevelBucket(lakeLevel), features);
        }

        return L.geoJSON({
          ...data,
          features: features
        }, {
          style: this.getStyle
        })
      }
    ));
  }

  getLegend(lakeLevel: number) : any[] {

    if (!this.featureCache.has(this.getLevelBucket(lakeLevel)))
    {
      return [
        {color:'#FFA112', label:'9 ft', value: 9, count: 0},
        {color:'#F7ED21', label:'12 ft', value: 12, count: 0},
        {color:'#A4CF22', label:'15 ft', value: 15, count: 0},
        {color:'#35911D', label:'18 ft', value: 18, count: 0},

      ]
    }
    if (this.legendCache.has(this.getLevelBucket(lakeLevel))) {
      return this.legendCache.get(this.getLevelBucket(lakeLevel))!;
    }
    else {
      var features = this.featureCache.get(this.getLevelBucket(lakeLevel))!;
      var legend = [
        {color:'#FFA112', label:'9 ft', value: 9, count: features.filter((x:any) => x.properties.gridcode === 9).length},
        {color:'#F7ED21', label:'12 ft', value: 12, count: features.filter((x:any) => x.properties.gridcode === 12).length},
        {color:'#A4CF22', label:'15 ft', value: 15, count: features.filter((x:any) => x.properties.gridcode === 15).length},
        {color:'#35911D', label:'18 ft', value: 18, count: features.filter((x:any) => x.properties.gridcode === 18).length},
      ];

      this.legendCache.set(this.getLevelBucket(lakeLevel), legend);
      return legend;
    }
  }

  private getLevelBucket(level: number) : number {
    return Math.floor(level / 3);
  }

  private getStyle(feature: any) {
    let rank = feature.properties.gridcode;
    let color = '#000000';
    if (rank === 6) color = '#FF0000';
    if (rank === 9) color = '#FFA112';
    if (rank === 12) color = '#F7ED21';
    if (rank === 15) color = '#A4CF22';
    if (rank === 18) color = '#35911D';


    return {
      fillColor: color,
      weight: 0,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  }

}
