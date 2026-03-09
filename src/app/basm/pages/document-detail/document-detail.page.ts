import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BASMDocument } from '../../types/basm.types';
import { BasmStoreService } from '../../services/basm-store.service';
import { BasmEngineService, DocumentTruthReport } from '../../services/basm-engine.service';

@Component({
  selector: 'app-basm-document-detail',
  templateUrl: 'document-detail.page.html',
  styleUrls: ['document-detail.page.scss'],
})
export class DocumentDetailPage implements OnInit {

  doc: BASMDocument | null = null;
  truth: DocumentTruthReport | null = null;
  activeTab = 'overview';

  constructor(
    private route: ActivatedRoute,
    private store: BasmStoreService,
    private engine: BasmEngineService,
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
}
