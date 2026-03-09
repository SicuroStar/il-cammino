import { Component, Input } from '@angular/core';
import { StalenesStatus } from '../../types/basm.types';

@Component({
  selector: 'basm-staleness-badge',
  template: `
    <ion-badge [color]="color">{{ label }}</ion-badge>
  `,
})
export class StalenessBadgeComponent {
  @Input() status: StalenesStatus | string = 'unknown';

  get color(): string {
    switch (this.status) {
      case 'fresh':   return 'success';
      case 'stale':   return 'warning';
      case 'expired': return 'danger';
      default:        return 'medium';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'fresh':   return 'Aggiornato';
      case 'stale':   return 'Obsoleto';
      case 'expired': return 'Scaduto';
      default:        return 'Sconosciuto';
    }
  }
}
