import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BASMDocument } from '../../types/basm.types';

@Component({
  selector: 'basm-json-export-modal',
  templateUrl: 'json-export-modal.component.html',
})
export class JsonExportModalComponent {
  @Input() doc: BASMDocument;

  copied = false;

  constructor(private modalCtrl: ModalController) {}

  get prettyJson(): string {
    return this.doc ? JSON.stringify(this.doc, null, 2) : '';
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.prettyJson);
      this.copied = true;
      setTimeout(() => { this.copied = false; }, 2000);
    } catch {
      // fallback: silently ignore on platforms without clipboard API
    }
  }

  downloadFile(): void {
    if (!this.doc) return;
    const blob = new Blob([this.prettyJson], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `basm-${this.doc.identity_context.app_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }
}
