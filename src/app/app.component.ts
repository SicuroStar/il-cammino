import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Dashboard BASM', url: '/basm', icon: 'shield-checkmark' },
    { title: 'Nuovo documento', url: '/basm/new', icon: 'add-circle' },
  ];
  public labels: string[] = [];
  constructor() {}
}
