import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { RekapPage } from './rekap.page';

@NgModule({
  declarations: [RekapPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: RekapPage }])
  ]
})
export class RekapPageModule {}
