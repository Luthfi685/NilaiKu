import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NilaiService, Semester, MataKuliah } from '../../services/nilai.service';
import { AlertController, ActionSheetController, LoadingController, ToastController } from '@ionic/angular';
// @ts-ignore
import * as Tesseract from 'tesseract.js';

@Component({
  selector: 'app-kalkulator',
  templateUrl: './kalkulator.page.html',
  styleUrls: ['./kalkulator.page.scss'],
  standalone: false,
})
export class KalkulatorPage implements OnInit {
  semesters: Semester[] = [];
  selectedSemester: Semester | null = null;
  nilaiOptions: string[] = [];
  currentIPS = 0;
  currentSKS = 0;

  // Form
  mkNama = '';
  mkSKS = 3;
  mkNilai = 'A';
  editingMk: MataKuliah | null = null;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private nilaiService: NilaiService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.nilaiOptions = this.nilaiService.getNilaiOptions();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.semesters = this.nilaiService.getSemesters();
    if (this.selectedSemester) {
      this.selectedSemester = this.semesters.find(s => s.id === this.selectedSemester!.id) || null;
    }
    if (!this.selectedSemester && this.semesters.length > 0) {
      this.selectedSemester = this.semesters[this.semesters.length - 1];
    }
    this.updateIPS();
  }

  addSemester() {
    const newSem = this.nilaiService.addSemester();
    this.semesters = this.nilaiService.getSemesters();
    this.selectedSemester = newSem;
    this.updateIPS();
  }

  async deleteSemester() {
    if (!this.selectedSemester) return;
    const alert = await this.alertController.create({
      header: 'Hapus Semester',
      message: `Yakin ingin menghapus ${this.selectedSemester.nama}? Semua mata kuliah di dalamnya akan terhapus.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.nilaiService.deleteSemester(this.selectedSemester!.id);
            this.selectedSemester = null;
            this.loadData();
          }
        }
      ]
    });
    await alert.present();
  }

  selectSemester(sem: Semester) {
    this.selectedSemester = sem;
    this.updateIPS();
    this.resetForm();
  }

  addOrUpdateMK() {
    if (!this.selectedSemester || !this.mkNama.trim()) return;

    if (this.editingMk) {
      this.nilaiService.updateMataKuliah(this.selectedSemester.id, {
        id: this.editingMk.id,
        nama: this.mkNama.trim(),
        sks: this.mkSKS,
        nilai: this.mkNilai
      });
    } else {
      this.nilaiService.addMataKuliah(this.selectedSemester.id, {
        nama: this.mkNama.trim(),
        sks: this.mkSKS,
        nilai: this.mkNilai
      });
    }

    this.resetForm();
    this.loadData();
  }

  editMK(mk: MataKuliah) {
    this.editingMk = mk;
    this.mkNama = mk.nama;
    this.mkSKS = mk.sks;
    this.mkNilai = mk.nilai;
  }

  deleteMK(mk: MataKuliah) {
    if (!this.selectedSemester) return;
    this.nilaiService.deleteMataKuliah(this.selectedSemester.id, mk.id);
    this.loadData();
  }

  resetForm() {
    this.editingMk = null;
    this.mkNama = '';
    this.mkSKS = 3;
    this.mkNilai = 'A';
  }

  updateIPS() {
    if (this.selectedSemester) {
      this.currentIPS = this.nilaiService.hitungIPS(this.selectedSemester);
      this.currentSKS = this.nilaiService.hitungTotalSKSSemester(this.selectedSemester);
    } else {
      this.currentIPS = 0;
      this.currentSKS = 0;
    }
  }

  getBobot(nilai: string): number {
    return this.nilaiService.getBobot(nilai);
  }

  getNilaiColor(nilai: string): string {
    const bobot = this.getBobot(nilai);
    if (bobot >= 3.5) return 'success';
    if (bobot >= 2.5) return 'primary';
    if (bobot >= 1.5) return 'warning';
    return 'danger';
  }

  triggerFileSelect() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  async handleImageScan(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const loading = await this.loadingController.create({
      message: 'Membaca teks dari gambar... Mohon tunggu.',
    });
    await loading.present();

    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const dataUrl = e.target.result;
        const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng+ind');
        await loading.dismiss();
        this.parseOCRText(text);
        input.value = ''; // reset
      };
      reader.readAsDataURL(file);
    } catch (error) {
      await loading.dismiss();
      this.showToast('Gagal memproses gambar.', 'danger');
    }
  }

  async parseOCRText(text: string) {
    // PRE-PROCESSING: normalisasi teks OCR
    text = text
      .replace(/&amp;/g, '&')
      .replace(/\[/g, 'I').replace(/\]/g, 'I')
      .replace(/[^\S\n]+/g, ' '); // collapse spasi dobel tapi JAGA newline

    const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // SMART LINE MERGER:
    // Sebuah baris matkul yang lengkap PASTI mengandung kode periode (20241/20242).
    // Kalau baris belum punya periode, gabungkan terus dengan baris berikutnya.
    const hasPeriode = (s: string) => /\b2[0oO]\d{2,3}\b/i.test(s);
    const mergedLines: string[] = [];

    for (const cur of rawLines) {
      // Kalau baris terakhir di buffer belum punya periode → gabungkan dengan baris sekarang
      if (mergedLines.length > 0 && !hasPeriode(mergedLines[mergedLines.length - 1])) {
        mergedLines[mergedLines.length - 1] += ' ' + cur;
      } else {
        mergedLines.push(cur);
      }
    }

    if (!this.selectedSemester) { this.addSemester(); }

    let found = 0;

    for (let line of mergedLines) {
      line = line.trim();
      if (!line || line.toLowerCase().includes('mata kuliah')) continue;
      if (!hasPeriode(line)) continue; // skip baris yang gak ada periode sama sekali

      let nama = '', sks = 0, nilai = '';
      let tokens = line.split(/\s+/);

      // Hapus nomor urut di awal (1, 2., 10, 11, dll)
      while (tokens.length > 0 && /^\d+[\.\)]?$/.test(tokens[0])) tokens.shift();

      // Hapus karakter sampah pendek (OCR typo seperti 'n', 'i') hanya jika token berikutnya kode matkul
      while (tokens.length > 1 && tokens[0].length <= 2 && !/^\d+$/.test(tokens[0]) && /^[A-Z]{2,}[0-9]{3,}/i.test(tokens[1])) {
        tokens.shift();
      }

      if (tokens.length < 5) continue;

      // Buang Kode Matkul di depan (IF1220008, UBPIF0003, dll)
      if (/^[A-Z]{2,}[0-9]{3,}/i.test(tokens[0])) tokens.shift();

      // Kumpulkan Nama Matkul hingga ketemu token Periode
      const nameTokens: string[] = [];
      let sksIdx = -1;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (/^2[0oO]\d{2,3}$/i.test(t) || /^2\d{4}$/.test(t)) {
          if (i + 2 < tokens.length) sksIdx = i + 2;
          break;
        }
        nameTokens.push(t);
      }

      if (sksIdx !== -1) {
        nama = nameTokens.join(' ').trim();
        const sksStr = tokens[sksIdx].toLowerCase().replace(/[il]/gi,'1').replace(/[oz]/gi,'0');
        sks = parseInt(sksStr, 10);

        const validGrades = ['A','A-','B+','B','B-','C+','C','C-','D','E'];
        const gradeTokens = tokens.slice(sksIdx + 1)
          .map(w => w.replace(/[^A-E\+\-]/g, ''))
          .filter(w => validGrades.includes(w));
        if (gradeTokens.length > 0) nilai = gradeTokens[gradeTokens.length - 1];
      }

      if (nama && sks > 0 && nilai) {
        nama = nama.replace(/^\d+[\.\)]\s*/, '').trim(); 
        
        let finalNilai = this.nilaiOptions.find(n => n === nilai);
        if (!finalNilai) {
          if (nilai.includes('A')) finalNilai = 'A';
          else if (nilai.includes('B')) finalNilai = 'B';
          else if (nilai.includes('C')) finalNilai = 'C';
        }

        if (finalNilai && sks >= 1 && sks <= 8) {
          this.nilaiService.addMataKuliah(this.selectedSemester!.id, {
            nama: nama || 'Mata Kuliah',
            sks: sks,
            nilai: finalNilai
          });
          found++;
        }
      }
    }

    this.loadData();
    
    if (found > 0) {
      this.showToast(`Berhasil menemukan ${found} mata kuliah dari gambar!`, 'success');
    } else {
      this.showToast('Tidak ada data SKS & Nilai yang valid ditemukan. Coba potong gambar lebih fokus.', 'warning');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'top'
    });
    await toast.present();
  }
}
