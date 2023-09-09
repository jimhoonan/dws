import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { SliderModule } from 'primeng/slider';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card'
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CalendarModule } from 'primeng/calendar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { InputNumberModule } from 'primeng/inputnumber';
import { ImageModule } from 'primeng/image';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    SliderModule,
    FormsModule,
    CardModule,
    DragDropModule,
    CalendarModule,
    BrowserAnimationsModule,
    InputNumberModule,
    ImageModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
