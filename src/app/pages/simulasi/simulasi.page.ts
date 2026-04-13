import { Component, OnInit } from '@angular/core';
import { NilaiService } from '../../services/nilai.service';

@Component({
  selector: 'app-simulasi',
  templateUrl: './simulasi.page.html',
  styleUrls: ['./simulasi.page.scss'],
  standalone: false,
})
export class SimulasiPage implements OnInit {
  targetIPK = 3.50;
  sksSisa = 20;
  currentIPK = 0;
  currentSKS = 0;

  result: { nilaiMinimum: number; nilaiHuruf: string; status: 'achievable' | 'difficult' | 'impossible' } | null = null;
  hasCalculated = false;

  constructor(private nilaiService: NilaiService) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.currentIPK = this.nilaiService.hitungIPK();
    this.currentSKS = this.nilaiService.getTotalSKS();
  }

  simulate() {
    this.result = this.nilaiService.simulasiTarget(this.targetIPK, this.sksSisa);
    this.hasCalculated = true;
  }

  getStatusIcon(): string {
    if (!this.result) return 'help-circle';
    switch (this.result.status) {
      case 'achievable': return 'checkmark-circle';
      case 'difficult': return 'warning';
      case 'impossible': return 'close-circle';
    }
  }

  getStatusText(): string {
    if (!this.result) return '';
    switch (this.result.status) {
      case 'achievable': return 'Target bisa tercapai!';
      case 'difficult': return 'Sulit tapi bukan tidak mungkin!';
      case 'impossible': return 'Target tidak bisa tercapai';
    }
  }

  getStatusColor(): string {
    if (!this.result) return 'medium';
    switch (this.result.status) {
      case 'achievable': return 'success';
      case 'difficult': return 'warning';
      case 'impossible': return 'danger';
    }
  }
}
