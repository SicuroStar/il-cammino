import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardPage } from './pages/dashboard/dashboard.page';
import { DocumentDetailPage } from './pages/document-detail/document-detail.page';
import { InterviewPage } from './pages/interview/interview.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
  },
  {
    path: 'new',
    component: InterviewPage,
  },
  {
    path: ':appId',
    component: DocumentDetailPage,
  },
  {
    path: ':appId/edit',
    component: InterviewPage,
  },
  {
    path: ':appId/edit/:block',
    component: InterviewPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BasmRoutingModule {}
