import { Injectable } from '@angular/core';

export interface MataKuliah {
  id: string;
  nama: string;
  sks: number;
  nilai: string;
}

export interface Semester {
  id: string;
  nomor: number;
  nama: string;
  mataKuliah: MataKuliah[];
}

export interface AkademikSummary {
  totalSKS: number;
  totalSemester: number;
  ipk: number;
  ipsTermutar: number;
  statusAkademik: string;
  statusColor: string;
  statusIcon: string;
}

@Injectable({
  providedIn: 'root'
})
export class NilaiService {

  private readonly STORAGE_KEY = 'nilaiku_data';

  private readonly nilaiBobot: { [key: string]: number } = {
    'A': 4.00, 'A-': 3.70, 'B+': 3.30, 'B': 3.00, 'B-': 2.70,
    'C+': 2.30, 'C': 2.00, 'C-': 1.70, 'D+': 1.30, 'D': 1.00, 'E': 0.00
  };

  constructor() { }

  getNilaiOptions(): string[] { return Object.keys(this.nilaiBobot); }
  getBobot(nilai: string): number { return this.nilaiBobot[nilai] ?? 0; }
  generateId(): string { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

  getSemesters(): Semester[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const semesters: Semester[] = JSON.parse(data);
        // Auto-migrate: ensure all SKS values are numbers (fix old string data)
        let needsSave = false;
        for (const sem of semesters) {
          for (const mk of sem.mataKuliah) {
            if (typeof mk.sks !== 'number') {
              mk.sks = Number(mk.sks);
              needsSave = true;
            }
          }
        }
        if (needsSave) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(semesters)); }
        return semesters;
      } catch { return []; }
    }
    return [];
  }

  saveSemesters(semesters: Semester[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(semesters));
  }

  addSemester(): Semester {
    const semesters = this.getSemesters();
    const nomor = semesters.length + 1;
    const newSemester: Semester = { id: this.generateId(), nomor, nama: `Semester ${nomor}`, mataKuliah: [] };
    semesters.push(newSemester);
    this.saveSemesters(semesters);
    return newSemester;
  }

  deleteSemester(semesterId: string): void {
    let semesters = this.getSemesters().filter(s => s.id !== semesterId);
    semesters.forEach((s, i) => { s.nomor = i + 1; s.nama = `Semester ${i + 1}`; });
    this.saveSemesters(semesters);
  }

  addMataKuliah(semesterId: string, mk: Omit<MataKuliah, 'id'>): void {
    const semesters = this.getSemesters();
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) {
      semester.mataKuliah.push({ ...mk, sks: Number(mk.sks), id: this.generateId() });
      this.saveSemesters(semesters);
    }
  }

  updateMataKuliah(semesterId: string, mk: MataKuliah): void {
    const semesters = this.getSemesters();
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) {
      const index = semester.mataKuliah.findIndex(m => m.id === mk.id);
      if (index !== -1) { semester.mataKuliah[index] = { ...mk, sks: Number(mk.sks) }; this.saveSemesters(semesters); }
    }
  }

  deleteMataKuliah(semesterId: string, mkId: string): void {
    const semesters = this.getSemesters();
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) { semester.mataKuliah = semester.mataKuliah.filter(m => m.id !== mkId); this.saveSemesters(semesters); }
  }

  hitungIPS(semester: Semester): number {
    if (!semester.mataKuliah.length) return 0;
    let totalBobot = 0, totalSKS = 0;
    for (const mk of semester.mataKuliah) {
      const sks = Number(mk.sks);
      totalBobot += this.getBobot(mk.nilai) * sks;
      totalSKS += sks;
    }
    return totalSKS > 0 ? totalBobot / totalSKS : 0;
  }

  hitungTotalSKSSemester(semester: Semester): number {
    return semester.mataKuliah.reduce((sum, mk) => sum + Number(mk.sks), 0);
  }

  hitungIPK(): number {
    const semesters = this.getSemesters();
    let totalBobot = 0, totalSKS = 0;
    for (const sem of semesters) {
      for (const mk of sem.mataKuliah) {
        const sks = Number(mk.sks);
        totalBobot += this.getBobot(mk.nilai) * sks;
        totalSKS += sks;
      }
    }
    return totalSKS > 0 ? totalBobot / totalSKS : 0;
  }

  getTotalSKS(): number {
    return this.getSemesters().reduce((total, sem) =>
      total + sem.mataKuliah.reduce((s, mk) => s + Number(mk.sks), 0), 0);
  }

  getSummary(): AkademikSummary {
    const semesters = this.getSemesters();
    const ipk = this.hitungIPK();
    const totalSKS = this.getTotalSKS();
    const lastSemester = semesters.length > 0 ? semesters[semesters.length - 1] : null;
    const ipsTermutar = lastSemester ? this.hitungIPS(lastSemester) : 0;
    let statusAkademik = 'Belum Ada Data', statusColor = 'medium', statusIcon = 'help-circle';
    if (totalSKS > 0) {
      if (ipk >= 3.51) { statusAkademik = 'Cum Laude'; statusColor = 'success'; statusIcon = 'trophy'; }
      else if (ipk >= 2.76) { statusAkademik = 'Sangat Memuaskan'; statusColor = 'primary'; statusIcon = 'star'; }
      else if (ipk >= 2.00) { statusAkademik = 'Memuaskan'; statusColor = 'warning'; statusIcon = 'thumbs-up'; }
      else { statusAkademik = 'Perlu Peningkatan'; statusColor = 'danger'; statusIcon = 'alert-circle'; }
    }
    return { totalSKS, totalSemester: semesters.length, ipk, ipsTermutar, statusAkademik, statusColor, statusIcon };
  }

  getMataKuliahPerluPerbaikan(): { mk: MataKuliah; semester: string }[] {
    const semesters = this.getSemesters();
    const perluPerbaikan: { mk: MataKuliah; semester: string }[] = [];
    for (const sem of semesters) {
      for (const mk of sem.mataKuliah) {
        if (mk.nilai === 'D' || mk.nilai === 'E') {
          perluPerbaikan.push({ mk, semester: sem.nama });
        }
      }
    }
    return perluPerbaikan;
  }

  simulasiTarget(targetIPK: number, sksSisa: number): { nilaiMinimum: number; nilaiHuruf: string; status: 'achievable' | 'difficult' | 'impossible' } {
    const totalSKSSekarang = this.getTotalSKS();
    const ipkSekarang = this.hitungIPK();
    const totalBobotSekarang = ipkSekarang * totalSKSSekarang;
    const totalSKSAkhir = totalSKSSekarang + sksSisa;
    const totalBobotDibutuhkan = targetIPK * totalSKSAkhir;
    const nilaiMinimum = sksSisa > 0 ? (totalBobotDibutuhkan - totalBobotSekarang) / sksSisa : 0;
    let nilaiHuruf = 'E', status: 'achievable' | 'difficult' | 'impossible' = 'impossible';
    if (nilaiMinimum <= 0) { nilaiHuruf = 'Sudah Tercapai!'; status = 'achievable'; }
    else if (nilaiMinimum <= 2.00) { nilaiHuruf = 'C'; status = 'achievable'; }
    else if (nilaiMinimum <= 2.70) { nilaiHuruf = 'B-'; status = 'achievable'; }
    else if (nilaiMinimum <= 3.00) { nilaiHuruf = 'B'; status = 'achievable'; }
    else if (nilaiMinimum <= 3.30) { nilaiHuruf = 'B+'; status = 'difficult'; }
    else if (nilaiMinimum <= 3.70) { nilaiHuruf = 'A-'; status = 'difficult'; }
    else if (nilaiMinimum <= 4.00) { nilaiHuruf = 'A'; status = 'difficult'; }
    else { nilaiHuruf = 'Tidak Mungkin'; status = 'impossible'; }
    return { nilaiMinimum: Math.max(0, nilaiMinimum), nilaiHuruf, status };
  }

  getChartData(): { labels: string[]; ipsData: number[]; ipkData: number[] } {
    const semesters = this.getSemesters();
    const labels: string[] = [], ipsData: number[] = [], ipkData: number[] = [];
    let totalBobot = 0, totalSKS = 0;
    for (const sem of semesters) {
      labels.push(`Sem ${sem.nomor}`);
      ipsData.push(parseFloat(this.hitungIPS(sem).toFixed(2)));
      for (const mk of sem.mataKuliah) {
        const sks = Number(mk.sks);
        totalBobot += this.getBobot(mk.nilai) * sks;
        totalSKS += sks;
      }
      ipkData.push(parseFloat((totalSKS > 0 ? totalBobot / totalSKS : 0).toFixed(2)));
    }
    return { labels, ipsData, ipkData };
  }

  resetAllData(): void { localStorage.removeItem(this.STORAGE_KEY); }

  getTheme(): string { return localStorage.getItem('nilaiku_theme') || 'light'; }

  getUserProfile(): string {
    return localStorage.getItem('nilaiku_user_name') || 'Mahasiswa';
  }

  setUserProfile(name: string) {
    localStorage.setItem('nilaiku_user_name', name);
  }

  getTargetSKS(): number {
    return parseInt(localStorage.getItem('nilaiku_target_sks') || '144', 10);
  }

  setTargetSKS(sks: number) {
    localStorage.setItem('nilaiku_target_sks', sks.toString());
  }

  getColorTheme(): string {
    return localStorage.getItem('nilaiku_color') || 'default';
  }

  setColorTheme(color: string) {
    const oldColor = this.getColorTheme();
    localStorage.setItem('nilaiku_color', color);
    if (oldColor !== 'default') document.body.classList.remove(`theme-${oldColor}`);
    if (color !== 'default') document.body.classList.add(`theme-${color}`);
  }

  setTheme(theme: string): void {
    localStorage.setItem('nilaiku_theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
    
    // Also re-apply color on app start just in case
    const currentColor = this.getColorTheme();
    if (currentColor !== 'default') document.body.classList.add(`theme-${currentColor}`);
  }

  initTheme(): void {
    document.body.classList.toggle('dark', this.getTheme() === 'dark');
  }
}
