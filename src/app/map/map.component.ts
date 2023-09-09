import { AfterViewInit, Component, ComponentFactoryResolver, ElementRef, OnInit, ViewChild, Renderer2, RendererFactory2, Injector, ApplicationRef, ViewContainerRef, ComponentFactory} from '@angular/core';
import * as L from 'leaflet';
import { ClimbScoreService } from '../climb-score.service';
import { LakeLevelService } from '../lake-level.service';
import { PhotosService } from '../photos.service';
import { PhotoData } from '../models/photo-data.model';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  sliderValue: number = 630;
  climbScoreLayer: any;
  legendItems: any[] = [];
  photoMarkers: any[] = [];

  preview = false;

  currentFlight!: Map<number,number>;

  constructor(private lakeLevelService: LakeLevelService, 
    private climbScoreService: ClimbScoreService, 
    private photoService: PhotosService,) {  }
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;
  @ViewChild('legendContainer') legendContainer!: ElementRef;
  @ViewChild('fullscreenPreview') fullscreenPreview!: ElementRef;

  ngOnInit() {
    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);
    this.getCurrentLakeDepth();
    this.resetCurrentFlight();
  }

  getCurrentLakeDepth() {
    this.lakeLevelService.getCurrentLakeLevel()
    .subscribe(x => this.sliderValue = x);
  }

  resetCurrentFlight() {
    this.currentFlight = new Map<number,number>([[6,0],[9,0],[12,0],[15,0],[18,0]])
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);

    document.addEventListener('keydown', (event: any) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        this.fullscreenPreview.nativeElement.style.display = 'none';
      }
    })

    this.fullscreenPreview.nativeElement.onclick = (event: any) => {
      this.fullscreenPreview.nativeElement.style.display = 'none';
    } 

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
      center: [30.3978, -98.0056],
      zoom: 12,
      zoomControl: false,
    });

    const tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '...'
    });

    tiles.addTo(this.map);
    this.redrawMap();
  }

  redrawMap() {
    if (this.climbScoreLayer) {
      this.map.removeLayer(this.climbScoreLayer);
    }

    this.resetCurrentFlight();

    this.climbScoreService.getLevelData(this.sliderValue).subscribe(layer => {
      this.map.addLayer(layer);
      this.climbScoreLayer = layer;
    })

    this.photoService.getPhotoData().subscribe(photoData => this.addPhotoLayer(photoData));

    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);
  }

  addPhotoLayer(photoData:PhotoData[]): void {
    for(let i = 0; i < this.photoMarkers.length; i++) {
      this.map.removeLayer(this.photoMarkers[i]);
    }

    this.photoMarkers = [];

    for(let i = 0; i < photoData.length; i++) {
      var data = photoData[i];
      if (data.latitude && data.longitude) {
        var circle = L.circle([data.latitude, data.longitude]).addTo(this.map);
        this.photoMarkers.push(circle);
        let thumbnailPath = this.photoService.getThumbnailUrl(data.id);
        let fullPath = this.photoService.getPhotoUrl(data.id);

        let imageTemplate = `<img src="${thumbnailPath}" height="150" width="150">`;

        circle.on('click', (e: L.LeafletEvent) => {
          e.target.unbindPopup();
          let popup;
          if (e.target.getPopup()) {
            popup = e.target.getPopup();
          } else {
            popup = e.target.bindPopup(imageTemplate, {
              className: 'no-close-button-popup',
            });
            popup.openPopup();
          }

          const imgElement = e.target.getPopup()._contentNode.querySelector('img');
          console.log(imgElement)

          imgElement.onclick = () => {
            const imgRef = this.fullscreenPreview.nativeElement.querySelector('img');
            imgRef.src = fullPath;
            this.fullscreenPreview.nativeElement.style.display = 'flex';
          }
        })

        circle.on('mouseover', (e : L.LeafletEvent) => {
          let popup = e.target.bindPopup(imageTemplate, {
            className: 'no-close-button-popup',
          });
          popup.openPopup();

          const imgElement = e.target.getPopup()._contentNode.querySelector('img');

          imgElement.onclick = () => {
            const imgRef = this.fullscreenPreview.nativeElement.querySelector('img');
            imgRef.src = fullPath;
            this.fullscreenPreview.nativeElement.style.display = 'flex';
          }

        });
      }
    }
  }

  legendClicked(value: number) {
    var filteredFeatures = this.climbScoreLayer.getLayers().filter((x:any) => x.feature.properties.gridcode === value);
    var index = this.currentFlight.get(value) ?? 0;
    var feature = filteredFeatures[index]

    this.currentFlight.set(value, (index + 1) % filteredFeatures.length)

    var bounds = feature.getBounds();

    this.map.flyToBounds(bounds, {duration: 2});
  }
}