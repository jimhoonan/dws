import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements AfterViewInit {
  images: any[] | undefined;
  showGallery: boolean = false;
  @ViewChild('fullscreenPreview') fullscreenPreview!: ElementRef;
  @ViewChild('galleryElement', { static: false}) galleryElement: ElementRef | undefined;
  @ViewChild('zoomableImg') zoomableImg!: ElementRef;

  private scale: number = 1;
  private translateX: number = 0;
  private translateY: number = 0;
  private readonly maxScale: number = 4;
  private readonly minScale: number = 1;

  isDragging = false;
  startX = 0;
  startY = 0;
  startTranslateX = 0;
  startTranslateY = 0;

  ngAfterViewInit(): void {
    document.addEventListener('keydown', (event: any) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        this.closeViewer();
      }
    })

    this.fullscreenPreview.nativeElement.onclick = (event: any) => {
      if (this.galleryElement && this.galleryElement.nativeElement && this.galleryElement.nativeElement.contains(event.target)) {
        return;
      } else {
        this.closeViewer();
      }
    } 
  }

  closeViewer() {
    this.fullscreenPreview.nativeElement.style.display = 'none';
    this.showGallery = false;
  }

  openViewer(images: any[]) {
    this.images = images;
    this.showGallery = true;
    this.fullscreenPreview.nativeElement.style.display = 'flex';
  }

  onImageLoad(item: any, img: HTMLImageElement) : void {
    item.isLoaded = true;

    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;
    img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

  onWheel(event: WheelEvent, img: HTMLImageElement): void {
  const scaleAmount = 0.1;
  const rect = img.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  console.log(`${offsetX},${offsetY}`);

  const direction = event.deltaY < 0 ? 1 : -1;
  const newScale = this.scale + scaleAmount * direction;

  if (newScale < this.minScale || newScale > this.maxScale) {
    return;
  }

  const translateX = -1 * (newScale - 1) * offsetX / newScale;
  const translateY = -1 * (newScale - 1) * offsetY / newScale;

  this.scale = newScale;
  this.translateX = translateX;
  this.translateY = translateY;

  img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  img.style.cursor = this.scale == 1 ? 'default' : 'grab';
  event.preventDefault();
  }

  onMouseDown(event: MouseEvent, img: HTMLImageElement): void {
    console.log(event);
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTranslateX = this.translateX;
    this.startTranslateY = this.translateY;
    img.style.cursor = this.scale == 1 ? 'default' : 'grabbing';
  }

onMouseMove(event: MouseEvent, img: HTMLImageElement): void {
    if (!this.isDragging) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.translateX = this.startTranslateX + dx;
    this.translateY = this.startTranslateY + dy;

    // Boundary checks
    const rect = img.getBoundingClientRect();
    if (this.translateX > 0) this.translateX = 0;
    if (this.translateY > 0) this.translateY = 0;
    if (this.translateX < (1 - this.scale) * rect.width / this.scale) this.translateX = (1 - this.scale) * rect.width / this.scale;
    if (this.translateY < (1 - this.scale) * rect.height / this.scale) this.translateY = (1 - this.scale) * rect.height / this.scale;

    img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
}

onMouseUp(event: MouseEvent, img: HTMLImageElement): void {
  console.log(event);

    this.isDragging = false;
    img.style.cursor = this.scale == 1 ? 'default' : 'grab';
  }

preventDefault(event: Event): void {
  event.preventDefault();
}
}
