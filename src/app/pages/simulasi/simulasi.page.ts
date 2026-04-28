import { Component, inject } from '@angular/core';
import { NilaiService } from '../../services/nilai.service';

@Component({
  selector: 'app-simulasi',
  templateUrl: './simulasi.page.html',
  styleUrls: ['./simulasi.page.scss'],
  standalone: false,
})
export class SimulasiPage {
  private nilaiService = inject(NilaiService);

  targetIPK = 3.50;
  sksSisa = 20;
  currentIPK = 0;
  currentSKS = 0;

  result: { nilaiMinimum: number; nilaiHuruf: string; status: 'achievable' | 'difficult' | 'impossible' } | null = null;
  hasCalculated = false;


  ionViewWillEnter() {
    this.currentIPK = this.nilaiService.hitungIPK();
    this.currentSKS = this.nilaiService.getTotalSKS();
  }

  get maxPossibleIPK(): number {
    if (this.currentSKS === 0 && this.sksSisa === 0) return 4.00;
    const currentPoints = this.currentIPK * this.currentSKS;
    const futurePoints = 4.00 * this.sksSisa; // 4.00 is max grade weight (A)
    return (currentPoints + futurePoints) / (this.currentSKS + this.sksSisa);
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
