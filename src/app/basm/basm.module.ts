import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

// Angular Material modules used in BASM pages
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

import { BasmRoutingModule } from './basm-routing.module';

// Pages
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { DocumentDetailPage } from './pages/document-detail/document-detail.page';
import { InterviewPage } from './pages/interview/interview.page';

// Components — Sprint 4
import { StalenessBadgeComponent } from './components/staleness-badge/staleness-badge.component';
import { ControlStatusRowComponent } from './components/control-status-row/control-status-row.component';
import { MaturityCardComponent } from './components/maturity-card/maturity-card.component';
import { RiskGaugeComponent } from './components/risk-gauge/risk-gauge.component';
import { GraphTopologyComponent } from './components/graph-topology/graph-topology.component';
import { JsonExportModalComponent } from './components/json-export-modal/json-export-modal.component';

// Components — Sprint 6
import { FairCalculatorComponent } from './components/fair-calculator/fair-calculator.component';
import { HistorySparklineComponent } from './components/history-sparkline/history-sparkline.component';

// Services (providedIn: 'root' — declared here for documentation purposes only)
import { BasmStoreService } from './services/basm-store.service';
import { BasmEngineService } from './services/basm-engine.service';
import { BasmValidatorService } from './services/basm-validator.service';

@NgModule({
  declarations: [
    DashboardPage,
    DocumentDetailPage,
    InterviewPage,
    // Sprint 4 components
    StalenessBadgeComponent,
    ControlStatusRowComponent,
    MaturityCardComponent,
    RiskGaugeComponent,
    GraphTopologyComponent,
    JsonExportModalComponent,
    // Sprint 6 components
    FairCalculatorComponent,
    HistorySparklineComponent,
  ],
  entryComponents: [
    JsonExportModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonicModule,
    // Angular Material
    MatStepperModule,
    MatExpansionModule,
    MatButtonModule,
    // BASM routing
    BasmRoutingModule,
  ],
})
export class BasmModule {}
