import { Component, OnInit, inject } from '@angular/core';
import { NilaiService } from './services/nilai.service';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private nilaiService = inject(NilaiService);
  private platform = inject(Platform);
  private location = inject(Location);

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
        const path = this.location.path();
        if (path === '' || path.includes('/tabs/dashboard') || path.includes('/dashboard')) {
          App.exitApp();
        } else {
          this.location.back();
        }
      });
    });
  }

  ngOnInit() {
    this.nilaiService.initTheme();
  }
}
