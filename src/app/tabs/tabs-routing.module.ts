import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'dashboard', loadChildren: () => import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule) },
      { path: 'kalkulator', loadChildren: () => import('../pages/kalkulator/kalkulator.module').then(m => m.KalkulatorPageModule) },
      { path: 'rekap', loadChildren: () => import('../pages/rekap/rekap.module').then(m => m.RekapPageModule) },
      { path: 'simulasi', loadChildren: () => import('../pages/simulasi/simulasi.module').then(m => m.SimulasiPageModule) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsRoutingModule {}
