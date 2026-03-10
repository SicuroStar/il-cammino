import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'basm',
    pathMatch: 'full'
  },
  {
    path: 'basm',
    loadChildren: () => import('./basm/basm.module')
      .then(m => m.BasmModule)
      .catch(e => { console.error('[Router] BasmModule load failed:', e); throw e; })
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
