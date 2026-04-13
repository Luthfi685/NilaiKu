import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NilaiService, AkademikSummary } from '../../services/nilai.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  @ViewChild('miniChart', { static: false }) miniChart!: ElementRef<HTMLCanvasElement>;

  userName = 'Mahasiswa';
  greeting = '';
  greetingIcon = '';
  summary: AkademikSummary = { totalSKS: 0, totalSemester: 0, ipk: 0, ipsTermutar: 0, statusAkademik: 'Belum Ada Data', statusColor: 'medium', statusIcon: 'help-circle' };
  ipkPercentage = 0;
  targetSKS = 144;
  progressSKS = 0;
  prediksiLulus = '';
  currentTheme = 'dark';
  currentColor = 'default';
  isSettingsOpen = false;
  tempUserName = '';
  chartData: { labels: string[]; ipsData: number[]; ipkData: number[] } = { labels: [], ipsData: [], ipkData: [] };
  semesterDetails: { nama: string; ips: number; sks: number }[] = [];
  perluPerbaikan: { mk: any; semester: string }[] = [];

  constructor(private nilaiService: NilaiService) {}

  ngOnInit() {
    this.currentTheme = this.nilaiService.getTheme();
    this.currentColor = this.nilaiService.getColorTheme();
    this.userName = this.nilaiService.getUserProfile();
    this.updateGreeting();
  }

  ionViewWillEnter() { this.loadData(); }
  ionViewDidEnter() { setTimeout(() => this.drawMiniChart(), 300); }

  loadData() {
    this.summary = this.nilaiService.getSummary();
    this.ipkPercentage = (this.summary.ipk / 4.0) * 100;
    this.progressSKS = Math.min((this.summary.totalSKS / this.targetSKS) * 100, 100);
    this.chartData = this.nilaiService.getChartData();
    const semesters = this.nilaiService.getSemesters();
    this.semesterDetails = semesters.map(sem => ({
      nama: sem.nama,
      ips: this.nilaiService.hitungIPS(sem),
      sks: this.nilaiService.hitungTotalSKSSemester(sem)
    }));
    this.perluPerbaikan = this.nilaiService.getMataKuliahPerluPerbaikan();
    this.calculatePrediksiLulus();
  }

  calculatePrediksiLulus() {
    const sisa = this.targetSKS - this.summary.totalSKS;
    if (sisa <= 0) {
      this.prediksiLulus = 'Selamat! Kamu sudah memenuhi syarat SKS kelulusan minimum.';
    } else if (this.summary.totalSemester > 0) {
      const avgSKS = this.summary.totalSKS / this.summary.totalSemester;
      const semSisa = Math.ceil(sisa / avgSKS);
      this.prediksiLulus = `Dengan kecepatan rata-rata ${avgSKS.toFixed(1)} SKS/semester, kamu diprediksi bisa lulus dalam <strong>${semSisa} semester</strong> lagi.`;
    } else {
      this.prediksiLulus = 'Tambahkan rekap nilaimu untuk melihat prediksi AI kapan kamu akan lulus.';
    }
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let timeGreeting = '';
    if (hour >= 5 && hour < 12) { timeGreeting = 'Selamat Pagi'; this.greetingIcon = 'sunny-outline'; }
    else if (hour >= 12 && hour < 15) { timeGreeting = 'Selamat Siang'; this.greetingIcon = 'partly-sunny-outline'; }
    else if (hour >= 15 && hour < 18) { timeGreeting = 'Selamat Sore'; this.greetingIcon = 'sunset-outline'; }
    else { timeGreeting = 'Selamat Malam'; this.greetingIcon = 'moon-outline'; }
    this.greeting = timeGreeting;
  }

  openSettings() {
    this.tempUserName = this.userName;
    this.isSettingsOpen = true;
  }

  selectColor(color: string) {
    this.currentColor = color;
    this.nilaiService.setColorTheme(color);
  }

  saveSettings() {
    this.userName = this.tempUserName || 'Mahasiswa';
    this.nilaiService.setUserProfile(this.userName);
    this.updateGreeting();
    this.isSettingsOpen = false;
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.nilaiService.setTheme(this.currentTheme);
    setTimeout(() => this.drawMiniChart(), 100);
  }

  getPredikat(): string {
    if (!this.summary || this.summary.totalSKS === 0) return '-';
    if (this.summary.ipk >= 3.51) return 'Cum Laude';
    if (this.summary.ipk >= 2.76) return 'Sangat Memuaskan';
    if (this.summary.ipk >= 2.00) return 'Memuaskan';
    return 'Perlu Peningkatan';
  }

  getIPSTrend(): string {
    if (this.chartData.ipsData.length < 2) return 'neutral';
    const last = this.chartData.ipsData[this.chartData.ipsData.length - 1];
    const prev = this.chartData.ipsData[this.chartData.ipsData.length - 2];
    return last > prev ? 'up' : last < prev ? 'down' : 'neutral';
  }

  resetData() {
    if (confirm('Yakin ingin menghapus semua data?')) {
      this.nilaiService.resetAllData();
      this.loadData();
      this.isSettingsOpen = false;
      setTimeout(() => this.drawMiniChart(), 100);
    }
  }

  drawMiniChart() {
    if (!this.miniChart || this.chartData.labels.length === 0) return;
    const canvas = this.miniChart.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width, h = rect.height;
    const pad = { top: 25, right: 15, bottom: 30, left: 35 };
    const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);

    const isDark = this.currentTheme === 'dark';
    const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const { labels, ipsData, ipkData } = this.chartData;
    const groupW = cw / labels.length;

    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ch - (ch * i / 4);
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(i.toFixed(1), pad.left - 6, y + 3);
    }

    if (ipsData.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < ipsData.length; i++) {
        const x = pad.left + groupW * i + groupW / 2;
        const y = pad.top + ch - (ipsData[i] / 4) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(pad.left + groupW * (ipsData.length - 1) + groupW / 2, pad.top + ch);
      ctx.lineTo(pad.left + groupW / 2, pad.top + ch);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
      areaGrad.addColorStop(0, 'rgba(102,126,234,0.25)');
      areaGrad.addColorStop(1, 'rgba(102,126,234,0.02)');
      ctx.fillStyle = areaGrad; ctx.fill();

      ctx.beginPath(); ctx.strokeStyle = '#667eea'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let i = 0; i < ipsData.length; i++) {
        const x = pad.left + groupW * i + groupW / 2;
        const y = pad.top + ch - (ipsData[i] / 4) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < ipsData.length; i++) {
        const x = pad.left + groupW * i + groupW / 2;
        const y = pad.top + ch - (ipsData[i] / 4) * ch;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#667eea'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fillStyle = isDark ? '#1a1a2e' : '#f5f5fa'; ctx.fill();
      }
    }

    if (ipkData.length > 1) {
      ctx.beginPath(); ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      for (let i = 0; i < ipkData.length; i++) {
        const x = pad.left + groupW * i + groupW / 2;
        const y = pad.top + ch - (ipkData[i] / 4) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < ipkData.length; i++) {
        const x = pad.left + groupW * i + groupW / 2;
        const y = pad.top + ch - (ipkData[i] / 4) * ch;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#43e97b'; ctx.fill();
      }
    }

    ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    for (let i = 0; i < labels.length; i++) {
      ctx.fillText(labels[i], pad.left + groupW * i + groupW / 2, h - pad.bottom + 16);
    }
  }
}
