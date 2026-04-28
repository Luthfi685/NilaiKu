import { Component, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { NilaiService, Semester } from '../../services/nilai.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-rekap',
  templateUrl: './rekap.page.html',
  styleUrls: ['./rekap.page.scss'],
  standalone: false,
})
export class RekapPage {
  private nilaiService = inject(NilaiService);

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  semesters: Semester[] = [];
  ipk = 0;
  totalSKS = 0;
  expandedSemester: string | null = null;
  exporting = false;

  chartData: { labels: string[]; ipsData: number[]; ipkData: number[] } = {
    labels: [], ipsData: [], ipkData: []
  };


  ionViewWillEnter() {
    this.loadData();
  }

  ionViewDidEnter() {
    setTimeout(() => this.drawChart(), 300);
  }

  loadData() {
    this.semesters = this.nilaiService.getSemesters();
    this.ipk = this.nilaiService.hitungIPK();
    this.totalSKS = this.nilaiService.getTotalSKS();
    this.chartData = this.nilaiService.getChartData();
  }

  getIPS(semester: Semester): number {
    return this.nilaiService.hitungIPS(semester);
  }

  getSKS(semester: Semester): number {
    return this.nilaiService.hitungTotalSKSSemester(semester);
  }

  toggleSemester(semId: string) {
    this.expandedSemester = this.expandedSemester === semId ? null : semId;
  }

  getBobot(nilai: string): number {
    return this.nilaiService.getBobot(nilai);
  }

  drawChart() {
    if (!this.chartCanvas || this.chartData.labels.length === 0) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const labels = this.chartData.labels;
    const ipsData = this.chartData.ipsData;
    const ipkData = this.chartData.ipkData;
    const maxVal = 4.0;
    const barWidth = Math.min(chartWidth / labels.length * 0.35, 32);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartHeight - (chartHeight * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '11px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(i.toFixed(1), padding.left - 8, y + 4);
    }

    // Bars & Line
    const groupWidth = chartWidth / labels.length;

    // Draw IPS bars
    for (let i = 0; i < labels.length; i++) {
      const x = padding.left + groupWidth * i + groupWidth / 2 - barWidth / 2;
      const barHeight = (ipsData[i] / maxVal) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // IPS bar with gradient
      const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
      ctx.fill();

      // Bar value
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(ipsData[i].toFixed(2), x + barWidth / 2, y - 6);

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px Inter';
      ctx.fillText(labels[i], padding.left + groupWidth * i + groupWidth / 2, height - padding.bottom + 20);
    }

    // Draw IPK line
    if (ipkData.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#43e97b';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (let i = 0; i < ipkData.length; i++) {
        const x = padding.left + groupWidth * i + groupWidth / 2;
        const y = padding.top + chartHeight - (ipkData[i] / maxVal) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dots
      for (let i = 0; i < ipkData.length; i++) {
        const x = padding.left + groupWidth * i + groupWidth / 2;
        const y = padding.top + chartHeight - (ipkData[i] / maxVal) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#43e97b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1e32';
        ctx.fill();
      }
    }
  }

  async exportPDF() {
    this.exporting = true;
    
    // Allow Angular to render the hidden container
    setTimeout(async () => {
      const element = document.getElementById('pdf-export-container');
      if (element) {
        try {
          // Temporarily fix positioning for html2canvas
          element.style.position = 'relative';
          element.style.left = '0';
          
          const canvas = await html2canvas(element, { 
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          // Revert positioning
          element.style.position = 'absolute';
          element.style.left = '-9999px';

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          // If height exceeds A4 page, it will scale down or cut off. For a simple app, fits on one page or cuts.
          // Ideally we scale it to fit or use autoTable, but png is fine for now
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('Transkrip_NilaiKu.pdf');
        } catch (error) {
          console.error("Error generating PDF", error);
        }
      }
      this.exporting = false;
    }, 150);
  }
}
