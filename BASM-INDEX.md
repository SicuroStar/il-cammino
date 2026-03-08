# BASM Index — Il Cammino Project
**Indice completo di tutti i file del progetto con significato, stato e relazioni**

> Aggiornare questo file ogni volta che si aggiunge, rinomina o archivia un file di progetto.
> Ultima revisione: 2026-03-08

---

## Come leggere questo indice

| Icona | Significato |
|---|---|
| ✅ | File completo / production-ready |
| 🔲 | Template blank — da compilare con i dati reali |
| 📋 | Guida / documento di supporto |
| ⚙️ | Configurazione / motore automatico |
| 🤖 | File generato automaticamente dal motore |
| 🔄 | File aggiornato dal CI/CD pipeline |

---

## 1. Schema e Configurazione BASM

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/schema/basm.schema.v3.json` | JSON Schema | ✅ | Schema JSON ufficiale v3.0-DIGITAL-TWIN. Definisce la struttura obbligatoria di ogni documento BASM. Usato da AJV nel pipeline CI/CD per validazione. |
| `src/app/basm/rag-manifest.json` | JSON Config | ✅ | Manifest del sistema RAG (Retrieval-Augmented Generation). Definisce l'indice dei documenti, i gruppi di co-retrieval, la pipeline embeddings (OpenAI text-embedding-3-large, 3072 dims) e la configurazione vector store. |

---

## 2. Motori di Elaborazione BASM

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/engine/maturity-delta.engine.ts` | TypeScript | ✅ | **Maturity Delta Engine** — Calcola i punteggi di maturità nel tempo tramite event sourcing. Gestisce SnapshotEvent e MaturityDelta. Produce 3 dimensioni: data_completeness, control_effectiveness, confidence_trend. Classifica la fase (Initial → Optimizing). |
| `src/app/basm/engine/staleness-cascade.engine.ts` | TypeScript | ✅ | **Truth Decay Engine v2.1** — Calcola lo stato di freschezza dei dati (fresh/stale/expired/unknown). Propaga il decadimento di confidenza verso i nodi dipendenti nel grafo. Previene "false green" da dati obsoleti. |
| `src/app/basm/engine/evidence-collector.engine.ts` | TypeScript | ✅ | **Evidence Collector Engine v2.4** — Raccoglie prove dai sistemi sorgente (Defender API, CrowdStrike, Tenable, SAP GRC, ecc.) tramite pattern adapter. Hash SHA-256 per audit trail. Produce CCMResult con mapping compliance. |
| `src/app/basm/engine/graph-analyzer.engine.ts` | TypeScript | ✅ | **Digital Twin Graph Engine v3.0** — Analisi del grafo di dipendenze applicative. Calcola blast radius (BFS), centralità dei nodi (junction points), percorsi di lateral movement. Costruisce il contesto RAG per analisi AI. |

---

## 3. Tipi TypeScript

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/types/basm.types.ts` | TypeScript | ✅ | Definizioni di tutti i tipi BASM: primitive (ISOTimestamp, ConfidenceScore), enum (AssetType, PurdueLevel, EdgeType, MaturityPhase), interfacce (DataLineage, StalenessCascade, SecurityControl, BASMDocument, GraphNode, TypedEdge). |

---

## 4. Dati di Esempio

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/sample/basm-conveyor-plc.sample.json` | JSON Sample | ✅ | **Documento BASM completo di esempio** per un PLC di linea conveyour (Siemens S7-1500). App ID: PLANT-CONVEYOR-PLC-001. Tier-1-Gold, 18.500 EUR/ora downtime, 3,25M EUR revenue at risk. Include tutti i campi compilati, snapshot history e maturity deltas. Usato come reference per validare lo schema e addestrare i reviewer. |

---

## 5. Template Intervista e Blank JSON — per tipo di sistema

Ogni tipo di sistema ha due file associati:
- **`interview-*.md`** — Guida strutturata per condurre l'intervista con i referenti aziendali
- **`basm-*.blank.json`** — Template JSON da compilare con le risposte dell'intervista

### 5.1 MES / Gestionale Produzione (Conta Pezzi)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/interviews/interview-mes-gestionale.md` | Markdown | ✅ | **Intervista MES/Gestionale** — 8 blocchi (A-H), 45-60 min. Copre sistemi di esecuzione produzione (MES), gestionale conta pezzi, software di chiusura lotti. Referente: Responsabile Produzione, Responsabile IT-OT. Purdue L3. |
| `src/app/basm/interviews/basm-mes-gestionale.blank.json` | JSON Blank | 🔲 | Template blank per MES/Gestionale. Pre-popolato con controlli: EDR, MFA, Backup, Patch, Logging. 4 graph_edges pre-configurati (DB, ERP, AD, Backup). 5 RAG chunks. |

### 5.2 ERP / SAP (Finance, Logistica, Produzione)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/interviews/interview-erp-sap.md` | Markdown | ✅ | **Intervista ERP/SAP** — 8 blocchi (A-H incluso Blocco F Finanziario/Audit). 45-60 min. Copre SAP S/4HANA, ECC, Microsoft Dynamics, Oracle ERP. Focus su moduli (FI/CO/SD/MM/PP), SoD, GRC, RFC connections. Referente: CFO, Responsabile IT-ERP. Purdue L4. |
| `src/app/basm/interviews/basm-erp-sap.blank.json` | JSON Blank | 🔲 | Template blank per ERP/SAP. Controlli: EDR, MFA+SoD, Backup HANA, Patch (Security Notes), Logging (SM20+SIEM). 4 graph_edges (DB, MES, AD, Backup). 6 RAG chunks incluso FINANCIAL-RISK. |

### 5.3 Active Directory / IAM (Identity & Access Management)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/interviews/interview-infra-ad.md` | Markdown | ✅ | **Intervista AD/IAM** — 8 blocchi (A-H incluso Blocco F Hardening Avanzato). 45-60 min. ⚠️ Sempre Tier-1-Gold. Copre topologia forest/domain, Domain Controller, Azure AD sync, Tier Model, PAM, Golden Ticket. Referente: CIO, System Admin. |
| `src/app/basm/interviews/basm-infra-ad.blank.json` | JSON Blank | 🔲 | Template blank per Active Directory. Criticality fissata a Tier-1-Gold. Controlli: EDR su DC, PAM, MFA privilegiati, Backup System State, Logging+Hardening. 3 graph_edges (ERP→AD, AD→AzureAD, Backup). RAG chunk speciale BLAST-RADIUS. |

### 5.4 SCADA / ICS (Sistemi di Controllo Industriale OT)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/interviews/interview-scada.md` | Markdown | ✅ | **Intervista SCADA/ICS** — 8 blocchi (A-H con Blocco F OT/Safety OBBLIGATORIO). 60-75 min. Copre HMI, SCADA supervisor, PLC di campo. Focus su Purdue model, protocolli OT (OPC-UA, Modbus, S7, DNP3), separazione OT/IT, SIS/SIL, CVE firmware, accesso remoto vendor. Referente: Automation Engineer, Plant Manager. |
| `src/app/basm/interviews/basm-scada.blank.json` | JSON Blank | 🔲 | Template blank per SCADA/ICS. asset_type=OT, purdue_level variabile (L2/L3). Blocco F compilato. Controlli: Whitelisting/OT Monitor, MFA operatori, Backup config PLC, Patch (vendor_driven), Segmentazione+Log. 5 graph_edges (PLC, Historian, MES, Jump Server, Backup). safety_impact obbligatorio. |

### 5.5 PLM / CAD (Product Lifecycle Management, Proprietà Intellettuale)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/basm/interviews/interview-plm.md` | Markdown | ✅ | **Intervista PLM/CAD** — 8 blocchi (A-H incluso Blocco F IP/Compliance). 45-60 min. Copre PTC Windchill, Siemens Teamcenter, Dassault ENOVIA, Autodesk Vault. Focus su IP theft risk, Export Control (ITAR/EAR), DLP, accesso fornitori, audit trail download. Referente: VP Engineering, CTO, R&D Manager. |
| `src/app/basm/interviews/basm-plm.blank.json` | JSON Blank | 🔲 | Template blank per PLM/CAD. Rischio primario: DATA EXFILTRATION (non solo downtime). Controlli: EDR, MFA+AccessCtrl, DLP, Backup vault, Logging+Classification. 6 graph_edges (DB, CAD clients, ERP/BOM, Portale fornitori, AD, Backup). RAG chunk IP-RISK dedicato. |

---

## 6. CI/CD Pipeline

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `.github/workflows/basm-embed.yml` | YAML GitHub Actions | ✅ | **Pipeline RAG Embedding automatica** (520+ righe). 7 job sequenziali: (1) detect-changes — rileva file BASM modificati; (2) validate-schema — validazione AJV v3.0; (3) compute-hashes — hash content per delta detection; (4) embed-and-upsert — embedding OpenAI text-embedding-3-large in batch; (5) writeback — aggiorna embedding_valid/last_embedded/content_hash; (6) staleness-invalidation — invalida chunk obsoleti; (7) pipeline-report — stato indice RAG (target: 100/100). Trigger: push su `main` con file `src/app/basm/**/*.json` modificati. |

---

## 7. Frontend Ionic/Angular (Shell UI)

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `src/app/app.module.ts` | TypeScript | ✅ | Modulo root Angular. Importa BrowserModule, IonicModule, AppRoutingModule. |
| `src/app/app.component.ts` | TypeScript | ✅ | Componente root con menu navigazione laterale (Inbox, Outbox, Favorites, Archived, Trash, Spam). |
| `src/app/app-routing.module.ts` | TypeScript | ✅ | Routing principale — lazy load del FolderModule. |
| `src/app/folder/folder.page.ts` | TypeScript | ✅ | Pagina generica folder — legge folder ID dai parametri URL. |
| `src/environments/environment.ts` | TypeScript | ✅ | Configurazione ambiente development (production: false). |
| `src/environments/environment.prod.ts` | TypeScript | ✅ | Configurazione ambiente production (production: true). |
| `src/theme/variables.scss` | SCSS | ✅ | Variabili tema Ionic (colori, font, spacing). |

---

## 8. Configurazione Progetto

| File | Tipo | Stato | Descrizione |
|---|---|---|---|
| `package.json` | JSON | ✅ | Dipendenze NPM (Angular 11.2.0, Ionic 5.5.2, Capacitor 3.0.0) e script di build. |
| `angular.json` | JSON | ✅ | Configurazione Angular CLI — build, serve, test. Output path: `www/`. |
| `tsconfig.json` | JSON | ✅ | Compilatore TypeScript — target ES2015, module ES2020. |
| `ionic.config.json` | JSON | ✅ | Configurazione Ionic (name: "Il cammino", type: angular). |
| `capacitor.config.json` | JSON | ✅ | Configurazione Capacitor per bridge nativo (iOS/Android). |
| `.eslintrc.json` | JSON | ✅ | Regole ESLint per il progetto. |
| `karma.conf.js` | JS | ✅ | Configurazione Karma test runner. |
| `e2e/protractor.conf.js` | JS | ✅ | Configurazione Protractor per test E2E. |

---

## 9. Sequenza di Priorità — Interviste da Condurre

Per un'azienda manifatturiera come Interroll AG, questa è la sequenza ottimale:

```
Priorità 1 ── ERP-SAP              → interview-erp-sap.md
             Blocca: fatturazione, ordini, pagamenti fornitori
             Referente: CFO, Responsabile IT-ERP

Priorità 2 ── INFRA-AD             → interview-infra-ad.md
             Blocca: autenticazione di TUTTO il resto
             Referente: CIO, System Administrator

Priorità 3 ── SCADA/ICS            → interview-scada.md
             Blocca: produzione fisica, safety operatori
             Referente: Plant Manager, Automation Engineer

Priorità 4 ── MES/Gestionale       → interview-mes-gestionale.md
             Blocca: conta pezzi, chiusura lotti, schedulazione
             Referente: Responsabile Produzione, IT-OT

Priorità 5 ── PLM/CAD              → interview-plm.md
             A rischio: proprietà intellettuale, disegni tecnici
             Referente: VP Engineering, CTO
```

---

## 10. Convenzioni di Naming

| Elemento | Pattern | Esempio |
|---|---|---|
| `app_id` | `<TIPO>-<SISTEMA>-<SEQ>` | `ERP-SAP-MAIN-001` |
| `control_id` | `CTRL-<SISTEMA>-<SEQ>-<TIPO>` | `CTRL-ERP-001-SOD` |
| `edge_id` | `EDGE-<SRC>-<TGT>-<SEQ>` | `EDGE-ERP001-AD-001` |
| `chunk_id` | `CHUNK-<APPID>-<TOPIC>` | `CHUNK-ERP001-FINANCIAL-RISK` |
| `snapshot_id` | `SNAP-<APPID>-<SEQ4>` | `SNAP-ERP-SAP-MAIN-001-0001` |
| `playbook_ref` | `PLAYBOOK-<SISTEMA>-<SCENARIO>-<SEQ>` | `PLAYBOOK-ERP-RANSOMWARE-001` |
| Interview file | `interview-<tipo>.md` | `interview-erp-sap.md` |
| Blank JSON | `basm-<tipo>.blank.json` | `basm-erp-sap.blank.json` |
| Sample BASM | `basm-<descrizione>.sample.json` | `basm-conveyor-plc.sample.json` |

---

## 11. Glossario Termini Chiave

| Termine | Significato |
|---|---|
| **BASM** | Business Application Security Model — framework di assessment sicurezza per applicazioni enterprise |
| **Crown Jewel** | Sistema il cui impatto, se compromesso, è critico per il business o la safety |
| **Blast Radius** | Numero di sistemi e valore economico a rischio a cascata se un nodo viene compromesso |
| **Staleness** | Decadimento della confidenza nei dati di un controllo di sicurezza nel tempo |
| **CCM** | Continuous Controls Monitoring — verifica automatica e continua dei controlli |
| **RAG** | Retrieval-Augmented Generation — pipeline AI che arricchisce le analisi con il contesto del documento BASM |
| **Purdue Level** | Livello del modello Purdue per ambienti OT/ICS (L0=sensori, L1=PLC, L2=HMI/SCADA, L3=MES, L4=ERP) |
| **SoD** | Segregation of Duties — separazione dei ruoli per prevenire frodi (es. chi crea fornitore ≠ chi approva pagamento) |
| **SIL** | Safety Integrity Level — livello di integrità di sicurezza funzionale (IEC 61511/62061) |
| **IEC 62443** | Standard internazionale per la sicurezza dei sistemi di automazione e controllo industriale |
| **ITAR/EAR** | Normative USA su Export Control per tecnologie dual-use e difesa |
| **PAM** | Privileged Access Management — gestione degli account con diritti elevati (es. Domain Admin) |
| **DLP** | Data Loss Prevention — sistema per prevenire l'uscita non autorizzata di dati |
| **Forest Recovery** | Procedura di ripristino completo di una foresta Active Directory |
| **Golden Ticket** | Attacco AD che sfrutta la compromissione del ticket KRBTGT per impersonare qualsiasi utente |

---

*BASM-INDEX.md — Il Cammino Project*
*Generato: 2026-03-08 | Aggiornare ad ogni modifica dei file di progetto*
