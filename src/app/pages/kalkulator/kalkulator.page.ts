import { Component, OnInit } from '@angular/core';
import { NilaiService, Semester, MataKuliah } from '../../services/nilai.service';
import { AlertController, ActionSheetController } from '@ionic/angular';

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

  constructor(
    private nilaiService: NilaiService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
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
}
