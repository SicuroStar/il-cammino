import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';

import { BASMDocument, RiskQuantification } from '../../types/basm.types';
import { BasmStoreService } from '../../services/basm-store.service';
import { BasmEngineService, DocumentTruthReport } from '../../services/basm-engine.service';
import { JsonExportModalComponent } from '../../components/json-export-modal/json-export-modal.component';

@Component({
  selector: 'app-basm-document-detail',
  templateUrl: 'document-detail.page.html',
  styleUrls: ['document-detail.page.scss'],
})
export class DocumentDetailPage implements OnInit {

  doc: BASMDocument | null = null;
  truth: DocumentTruthReport | null = null;
  activeTab = 'overview';
  pendingRq: RiskQuantification | null = null;
  savingRq = false;

  constructor(
    private route: ActivatedRoute,
    private store: BasmStoreService,
    private engine: BasmEngineService,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit(): void {
    const appId = this.route.snapshot.paramMap.get('appId');
    if (appId) {
      this.doc = this.store.getDocument(appId) ?? null;
      if (this.doc) {
        this.truth = this.engine.evaluateDocumentTruth(this.doc);
      }
    }
  }

  get maturity() {
    return this.doc?.maturity_scoring;
  }

  get bia() {
    return this.doc?.business_impact_analysis;
  }

  get controls() {
    return this.doc?.security_controls ?? [];
  }

  get edges() {
    return this.doc?.graph_edges ?? [];
  }

  compositePercent(): number {
    return (this.maturity?.composite_score ?? 0) * 100;
  }

  indicatorColor(indicator: string): string {
    const map: Record<string, string> = {
      green: 'success',
      yellow: 'warning',
      red: 'danger',
      gray: 'medium',
    };
    return map[indicator] ?? 'medium';
  }

  onRqChange(rq: RiskQuantification): void {
    this.pendingRq = rq;
  }

  async saveRq(): Promise<void> {
    if (!this.doc || !this.pendingRq) return;
    this.savingRq = true;
    try {
      const updated: BASMDocument = { ...this.doc, risk_quantification: this.pendingRq };
      this.doc = await this.store.upsertDocument(updated, 'Aggiornamento FAIR da calcolatore');
      this.pendingRq = null;
    } finally {
      this.savingRq = false;
    }
  }

  async openExportModal(): Promise<void> {
    if (!this.doc) return;
    const modal = await this.modalCtrl.create({
      component: JsonExportModalComponent,
      componentProps: { doc: this.doc },
    });
    await modal.present();
  }
}
