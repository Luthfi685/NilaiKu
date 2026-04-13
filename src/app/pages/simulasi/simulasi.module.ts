import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SimulasiPage } from './simulasi.page';

@NgModule({
  declarations: [SimulasiPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: SimulasiPage }])
  ]
})
export class SimulasiPageModule {}
