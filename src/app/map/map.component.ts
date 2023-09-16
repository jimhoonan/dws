import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { ClimbScoreService } from '../climb-score.service';
import { LakeLevelService } from '../lake-level.service';
import { PhotosService } from '../photos.service';
import { PhotoData } from '../models/photo-data.model';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { ZonesService } from '../zones.service';
import { ZoneData } from '../models/zone-data.model';

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
  drawnZones: L.Polygon[] = [];

  displayPhotos = false;
  displayScore = false;
  displayZones = false;

  currentFlight!: Map<number,number>;

  constructor(private lakeLevelService: LakeLevelService, 
    private climbScoreService: ClimbScoreService, 
    private photoService: PhotosService,
    private cdRef: ChangeDetectorRef,
    private zonesService: ZonesService) {  }
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;
  @ViewChild('legendContainer') legendContainer!: ElementRef;
  @ViewChild('imageViewer') imageViewer!: ImageViewerComponent;
  @ViewChild('layerControls') layerControls!: ElementRef;
    
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

    this.cdRef.detectChanges();

    this.sliderContainer.nativeElement.addEventListener('mouseover', () => {
      this.map.dragging.disable();
    });

    this.legendContainer.nativeElement.addEventListener('mouseover', () => {
      this.map.dragging.disable();
    });

    this.layerControls.nativeElement.addEventListener('mouseover', () => {
      this.map.dragging.disable();
    });

    this.sliderContainer.nativeElement.addEventListener('mouseout', () => {
      this.map.dragging.enable();
    });

    this.legendContainer.nativeElement.addEventListener('mouseout', () => {
      this.map.dragging.enable();
    });

    this.layerControls.nativeElement.addEventListener('mouseout', () => {
      this.map.dragging.enable();
    });
  }

  togglePhotos(e: MouseEvent) : void {
    e.stopPropagation();
    this.displayPhotos = !this.displayPhotos;
    this.redrawMap();
  } 

  toggleScore(e: MouseEvent) : void {
    e.stopPropagation();
    this.displayScore = !this.displayScore;
    this.redrawMap();
  }

  toggleZones(e: MouseEvent) : void {
    e.stopPropagation();
    this.displayZones = !this.displayZones;
    this.redrawMap();
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

    //this.enableLatLongPopup();
    this.redrawMap();
  }

  enableLatLongPopup() {
    let popup = L.popup();

    this.map.on('click', (e: L.LeafletMouseEvent) => 
    {
      popup.setLatLng(e.latlng)
      .setContent(e.latlng.toString())
      .openOn(this.map);
    })
  }

  enableDraw() {
        // Initialise the FeatureGroup to store editable layers
        var drawnItems = new L.FeatureGroup();
        this.map.addLayer(drawnItems);
    
        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems
          },
          draw: {
            polygon: {},
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
          }
        });
        this.map.addControl(drawControl);
    
        this.map.on(L.Draw.Event.CREATED, function (e) {
          var layer = e.layer;
    
          // Here's where you can save off the polygon coordinates
          console.log(layer.getLatLngs());
    
          drawnItems.addLayer(layer);
        });
  }

  redrawMap() {
    if (this.climbScoreLayer) {
      this.map.removeLayer(this.climbScoreLayer);
    }

    this.clearPhotoLayer();

    this.resetCurrentFlight();

    if (this.displayScore) {
      this.climbScoreService.getLevelData(this.sliderValue).subscribe(layer => {
        this.map.addLayer(layer);
        this.climbScoreLayer = layer;
      });
    }

    if (this.displayPhotos) {
      var radius = L.circle([0,0]).getRadius();  
      this.photoService.getPhotoData(radius).subscribe(photoGroups => this.addPhotoLayer(photoGroups));
    }

    if (this.displayZones) {
      this.zonesService.getZoneData().subscribe((zones:ZoneData[]) => this.addZoneLayer(zones));
    }

    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);
  }

  clearPhotoLayer(): void {
    for(let i = 0; i < this.photoMarkers.length; i++) {
      this.map.removeLayer(this.photoMarkers[i]);
    }
  }

  clearZoneLayer(): void {
    for(let i = 0; i < this.drawnZones.length; i++) {
      this.drawnZones[i].remove();
    }
  }

  addZoneLayer(zones: ZoneData[]): void {
    this.clearZoneLayer();

    for(let i = 0; i < zones.length; i++) {
      let zone = zones[i];
      let polygon = L.polygon(zone.shape).addTo(this.map);
      this.drawnZones.push(polygon);

      let popupTemplate = `<span>${zone.name}</span>`

      let showPopup = (e: L.LeafletEvent) => {
        e.target.unbindPopup();
        let popup = e.target.bindPopup(popupTemplate, {
          className: 'no-close-button-popup',
        });
        popup.openPopup();
      };

      polygon.on('click', (e: L.LeafletEvent) => {
        showPopup(e);
      })

      polygon.on('mouseover', (e : L.LeafletEvent) => {
        showPopup(e);
      });
    }
  }

  addPhotoLayer(groups: Map<number, PhotoData[]>): void {
    this.clearPhotoLayer();

    this.photoMarkers = [];

    for(const [key, value] of groups) {
      var data = value[0];
      if (data.latitude && data.longitude) {
        var circle = L.circle([data.latitude, data.longitude]).addTo(this.map);
        this.photoMarkers.push(circle);
        let thumbnailPath = this.photoService.getThumbnailUrl(data.id);

        let imageTemplate = `<img src="${thumbnailPath}" height="150" width="150">`;


        let showPopup = (e: L.LeafletEvent) => {
          e.target.unbindPopup();
          let popup = e.target.bindPopup(imageTemplate, {
            className: 'no-close-button-popup',
          });
          popup.openPopup();

          const imgElement = e.target.getPopup()._contentNode.querySelector('img');
          console.log(imgElement)

          imgElement.onclick = () => {
            let images = value.map((x:PhotoData) => {
              return {thumbnailImageSrc: this.photoService.getThumbnailUrl(x.id), itemImageSrc: this.photoService.getPhotoUrl(x.id), isLoaded: false, level: x.level};
            });

            this.imageViewer.openViewer(images);
          }
        }

        circle.on('click', (e: L.LeafletEvent) => {
          showPopup(e);
        })

        circle.on('mouseover', (e : L.LeafletEvent) => {
          showPopup(e);
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