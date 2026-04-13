import { Component, OnInit } from '@angular/core';
import { NilaiService } from './services/nilai.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private nilaiService: NilaiService) {}

  ngOnInit() {
    this.nilaiService.initTheme();
  }
}
