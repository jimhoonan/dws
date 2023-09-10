import { AfterViewInit, Component, ComponentFactoryResolver, ElementRef, OnInit, ViewChild, Renderer2, RendererFactory2, Injector, ApplicationRef, ViewContainerRef, ComponentFactory, ChangeDetectorRef} from '@angular/core';
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

  showGallery = false;

  currentFlight!: Map<number,number>;

  constructor(private lakeLevelService: LakeLevelService, 
    private climbScoreService: ClimbScoreService, 
    private photoService: PhotosService,
    private cdRef: ChangeDetectorRef) {  }
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;
  @ViewChild('legendContainer') legendContainer!: ElementRef;
  @ViewChild('fullscreenPreview') fullscreenPreview!: ElementRef;
  @ViewChild('galleryElement', { static: false}) galleryElement: ElementRef | undefined;

  images: any[] | undefined;
    
  responsiveOptions: any[] | undefined;

  ngOnInit() {
    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);
    this.getCurrentLakeDepth();
    this.resetCurrentFlight();
    this.responsiveOptions = [
      {
          breakpoint: '1024px',
          numVisible: 5
      },
      {
          breakpoint: '768px',
          numVisible: 3
      },
      {
          breakpoint: '560px',
          numVisible: 1
      }
  ];
  }

  getCurrentLakeDepth() {
    this.lakeLevelService.getCurrentLakeLevel()
    .subscribe(x => this.sliderValue = x);
  }

  resetCurrentFlight() {
    this.currentFlight = new Map<number,number>([[6,0],[9,0],[12,0],[15,0],[18,0]])
  }

  onImageLoad(item: any) {
    item.isLoaded = true;
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);

    document.addEventListener('keydown', (event: any) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        this.fullscreenPreview.nativeElement.style.display = 'none';
        this.showGallery = false;
      }
    })
    this.cdRef.detectChanges();

    this.fullscreenPreview.nativeElement.onclick = (event: any) => {
      console.log(this.galleryElement?.nativeElement);
      if (this.galleryElement && this.galleryElement.nativeElement && this.galleryElement.nativeElement.contains(event.target)) {
        return;
      } else {
        this.showGallery = false;
        this.fullscreenPreview.nativeElement.style.display = 'none';
      }
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

    var radius = L.circle([0,0]).getRadius();

    this.photoService.getPhotoData(radius).subscribe(photoGroups => this.addPhotoLayer(photoGroups));

    this.legendItems = this.climbScoreService.getLegend(this.sliderValue);
  }

  addPhotoLayer(groups: Map<number, PhotoData[]>): void {
    for(let i = 0; i < this.photoMarkers.length; i++) {
      this.map.removeLayer(this.photoMarkers[i]);
    }

    this.photoMarkers = [];

    for(const [key, value] of groups) {
      var data = value[0];
      if (data.latitude && data.longitude) {
        var circle = L.circle([data.latitude, data.longitude]).addTo(this.map);
        this.photoMarkers.push(circle);
        let thumbnailPath = this.photoService.getThumbnailUrl(data.id);

        let imageTemplate = `<img src="${thumbnailPath}" height="150" width="150">`;


        let openPopup = (e: L.LeafletEvent) => {
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
            this.images = value.map((x:PhotoData) => {
              return {thumbnailImageSrc: this.photoService.getThumbnailUrl(x.id), itemImageSrc: this.photoService.getPhotoUrl(x.id), isLoaded: false, level: x.level};
            });
            this.showGallery = true;
            this.fullscreenPreview.nativeElement.style.display = 'flex';
          }
        }

        circle.on('click', (e: L.LeafletEvent) => {
          e.target.unbindPopup();
          openPopup(e);
        })

        circle.on('mouseover', (e : L.LeafletEvent) => {
          openPopup(e);
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