import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BASMDocument } from '../../types/basm.types';
import { BasmStoreService } from '../../services/basm-store.service';
import { BasmEngineService, DocumentTruthReport } from '../../services/basm-engine.service';
import { BasmValidatorService } from '../../services/basm-validator.service';

interface DashboardCard {
  doc: BASMDocument;
  truth: DocumentTruthReport;
}

@Component({
  selector: 'app-basm-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  cards$: Observable<DashboardCard[]>;
  importError: string | null = null;

  constructor(
    public store: BasmStoreService,
    private engine: BasmEngineService,
    private validator: BasmValidatorService,
  ) {}

  ngOnInit(): void {
    this.cards$ = this.store.documents$.pipe(
      map(docs => docs.map(doc => ({
        doc,
        truth: this.engine.evaluateDocumentTruth(doc),
      })))
    );
  }

  onImportClick(): void {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    this.importError = null;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = this.store.importFromJson(text);
      if (!result) {
        this.importError = 'Il file non è un documento BASM valido.';
      }
    } catch {
      this.importError = 'Errore di lettura del file.';
    } finally {
      input.value = '';
    }
  }

  exportDoc(appId: string, event: Event): void {
    event.stopPropagation();
    this.store.exportToFile(appId);
  }

  deleteDoc(appId: string, event: Event): void {
    event.stopPropagation();
    this.store.deleteDocument(appId);
  }

  tierColor(tier: string): string {
    const t = (tier ?? '').toLowerCase();
    if (t.includes('gold'))   return 'warning';
    if (t.includes('silver')) return 'medium';
    if (t.includes('bronze')) return 'tertiary';
    return 'primary';
  }

  riskEur(doc: BASMDocument): number {
    return doc.risk_quantification?.risk_score_annualized_eur ?? 0;
  }

  compositeScore(doc: BASMDocument): number {
    return (doc.maturity_scoring?.composite_score ?? 0) * 100;
  }
}
