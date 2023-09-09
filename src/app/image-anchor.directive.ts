import { Directive, ViewContainerRef } from "@angular/core";

@Directive({
    selector: '[imageAnchor]',
  })
  export class ImageAnchorDirective {
    constructor(public viewContainerRef: ViewContainerRef) {}
  }