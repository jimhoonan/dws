import { style } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  sliderValue: number = 630;
  geojsonLayer: any;
  data: any;

  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadGeoJSON();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [20, 0],  // Adjust this to your desired initial center
      zoom: 2
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '...'
    });

    tiles.addTo(this.map);
  }

  private loadGeoJSON(): void {
    this.http.get('../../assets/geojson/merged.geojson').subscribe(data => {
      this.data = data;
      this.redrawMap();
    });
  }

  redrawMap() {
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
    }

    const filteredData = {
      ...this.data,
      features: this.data.features.filter((feature : any) => feature.properties.featureProperty <= this.sliderValue)
    };

    this.geojsonLayer = L.geoJSON(filteredData, {
      style: this.getStyle
    }).addTo(this.map);
  }

  getStyle(feature: any) {
    let rank = feature.properties.gridcode;
    let color = '#000000';
    if (rank === 1) color = '#FF0000';
    if (rank === 2) color = '#FE7719';
    if (rank === 3) color = '#FFA112';
    if (rank === 4) color = '#FDC820';
    if (rank === 5) color = '#F7ED21';
    if (rank === 6) color = '#D8EF21';
    if (rank === 7) color = '#A4CF22';
    if (rank === 8) color = '#6FB00E';
    if (rank === 9) color = '#35911D';

    return {
      fillColor: color,
      weight: 0,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  }
}