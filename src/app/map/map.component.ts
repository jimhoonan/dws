import { style } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  legendItems: any[] = [];

  currentFlight!: Map<number,number>;
  legendCache!: Map<number, any[]>;
  featureCache!: Map<number, any[]>;

  constructor(private http: HttpClient) { }
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;
  @ViewChild('legendContainer') legendContainer!: ElementRef;

  ngOnInit() {
    this.legendCache = new Map<number, any[]>();
    this.featureCache = new Map<number, any[]>();
    this.legendItems = this.getLegend();
    this.getCurrentLakeDepth();
    this.resetCurrentFlight();
  }

  getCurrentLakeDepth() {
    this.http.get('/api/lakelevel')
    .subscribe((x: any) => {
      console.log(x)
      if (x.level) {
        this.sliderValue = Math.min(Math.max(Math.floor(x.level), 592),705)
      }
    })
  }

  resetCurrentFlight() {
    this.currentFlight = new Map<number,number>([[6,0],[9,0],[12,0],[15,0],[18,0]])
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadGeoJSON();
    this.legendItems = this.getLegend();

    this.sliderContainer.nativeElement.addEventListener('mouseover', () => {
      this.map.dragging.disable();
    });

    this.legendContainer.nativeElement.addEventListener('mouseover', () => {
      this.map.dragging.disable();
    });

    this.sliderContainer.nativeElement.addEventListener('mouseout', () => {
      this.map.dragging.enable();
    });

    this.legendContainer.nativeElement.addEventListener('mouseout', () => {
      this.map.dragging.enable();
    });
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [30.3978, -98.0056],  // Adjust this to your desired initial center
      zoom: 12,
      zoomControl: false,
    });

    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
    });

    const tiles = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
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

  getSliderBucket() : number {
    return Math.floor(this.sliderValue / 3);
  }

  redrawMap() {
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
    }

    this.resetCurrentFlight();
    let features;

    if (this.featureCache.has(this.getSliderBucket())) {
      features = this.featureCache.get(this.getSliderBucket());
    }
    else {
      features = this.data.features
      .filter((feature : any) => this.sliderValue <= feature.properties.level && feature.properties.level < this.sliderValue + 3)
      .sort((a: any, b: any) => b.properties.Area - a.properties.Area);

      this.featureCache.set(this.getSliderBucket(), features);
    }

    this.geojsonLayer = L.geoJSON({
      ...this.data,
      features: features
    }, {
      style: this.getStyle
    });
    this.map.addLayer(this.geojsonLayer);

    this.legendItems = this.getLegend();
}

  getLegend() : any[] {

    if (!this.featureCache.has(this.getSliderBucket()))
    {
      return [
        {color:'#FFA112', label:'9 ft', value: 9, count: 0},
        {color:'#F7ED21', label:'12 ft', value: 12, count: 0},
        {color:'#A4CF22', label:'15 ft', value: 15, count: 0},
        {color:'#35911D', label:'18 ft', value: 18, count: 0},

      ]
    }
    if (this.legendCache.has(this.getSliderBucket())) {
      return this.legendCache.get(this.getSliderBucket())!;
    }
    else {
      var features = this.featureCache.get(this.getSliderBucket())!;
      var legend = [
        {color:'#FFA112', label:'9 ft', value: 9, count: features.filter((x:any) => x.properties.gridcode === 9).length},
        {color:'#F7ED21', label:'12 ft', value: 12, count: features.filter((x:any) => x.properties.gridcode === 12).length},
        {color:'#A4CF22', label:'15 ft', value: 15, count: features.filter((x:any) => x.properties.gridcode === 15).length},
        {color:'#35911D', label:'18 ft', value: 18, count: features.filter((x:any) => x.properties.gridcode === 18).length},
      ];

      this.legendCache.set(this.getSliderBucket(), legend);
      return legend;
    }
  }

  legendClicked(value: number) {
    var filteredFeatures = this.geojsonLayer.getLayers().filter((x:any) => x.feature.properties.gridcode === value);
    var index = this.currentFlight.get(value) ?? 0;
    var feature = filteredFeatures[index]

    this.currentFlight.set(value, (index + 1) % filteredFeatures.length)

    var bounds = feature.getBounds();

    this.map.flyToBounds(bounds, {duration: 2});
  }

  getStyle(feature: any) {
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