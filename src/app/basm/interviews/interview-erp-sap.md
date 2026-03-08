# Intervista BASM — ERP / SAP (Ciclo Attivo e Passivo, Finance, Logistica)
**Template di intervista strutturata per compilare il BASM v3.0 a 100/100**

---

> **Come usare questo documento**
> Ogni domanda riporta tra parentesi il campo JSON che popola.
> Rispondi liberamente — non servono risposte tecniche precise.
> L'intervistatore traduce le tue risposte nei valori corretti.
> Tempo stimato: 45–60 minuti.
> **Referente ideale:** CFO, Responsabile IT-ERP, Responsabile Accounting, Controller.

---

## BLOCCO A — Identità e Responsabilità
*Obiettivo: capire chi possiede il sistema e perché esiste.*

---

**A1.** Come si chiama ufficialmente il sistema ERP che gestiamo oggi?
Qual è la release/versione? (es. SAP S/4HANA 2023, SAP ECC 6.0, Microsoft Dynamics 365, Oracle ERP Cloud)
> *(→ `identity_context.name`, `ot_context.firmware.current_version`)*

---

**A2.** Chi è il responsabile di business di questa applicazione?
Se l'ERP si fermasse alle 14:00 di un lunedì, chi riceve la chiamata e deve rispondere al CFO e al CEO?
> *(→ `identity_context.business_owner.name`, `.department`, `.contact`)*

---

**A3.** Chi è il responsabile tecnico SAP (BASIS o equivalente)?
C'è un team interno o è esternalizzato a un system integrator?
> *(→ `identity_context.technical_lead`)*

---

**A4.** Classificazione criticità:

- 🔴 **Tier-1 Gold** — L'ERP gestisce la fatturazione, l'ordine cliente, la chiusura contabile
- 🟡 **Tier-2 Silver** — Alcune funzioni critiche ma con workaround manuale per qualche ora
- 🟢 **Tier-3 Bronze** — Usiamo l'ERP solo per reporting o funzioni non core

> *(→ `identity_context.criticality_class`)*

---

## BLOCCO B — Impatto sul Business
*Obiettivo: quantificare in euro cosa succede se l'ERP cade.*

---

**B1.** Quali processi aziendali critici dipendono da questo sistema?
(es. "confermiamo gli ordini cliente", "emettiamo fatture", "paghiamo i fornitori", "chiudiamo il bilancio mensile")

Elenco tipico SAP da esplorare:
| Modulo | Processo | Dipendenza diretta |
|---|---|---|
| SD (Sales & Distribution) | Ordini cliente, spedizioni, fatturazione attiva | sì/no |
| MM (Materials Management) | Ordini acquisto, ricevimento merce, fatturazione passiva | sì/no |
| FI (Finance) | Contabilità generale, scadenziari, bilancio | sì/no |
| CO (Controlling) | Cost center, profitability, budget | sì/no |
| PP (Production Planning) | Ordini di produzione, pianificazione MRP | sì/no |
| WM/EWM (Warehouse) | Gestione magazzino | sì/no |

> *(→ `business_impact_analysis.process_chain`)*

---

**B2.** Se l'ERP fosse completamente indisponibile per 1 ora:
- Quante fatture non potete emettere? × valore medio fattura
- Quanti ordini cliente si bloccano?
- Quanti pagamenti fornitori saltano (rischio penali)?

Stima euro/ora di fermo:
> *(→ `business_impact_analysis.hourly_downtime_cost`)*

---

**B3.** Esistono periodi dell'anno in cui un'interruzione è inaccettabile?
(es. "chiusura trimestrale", "fine mese contabile", "campagna ordini di fine anno")
Qual è la finestra più critica?
> *(→ nota per `board_notification_threshold` e pianificazione audit)*

---

**B4.** Avete una polizza assicurativa cyber che coprirebbe un blocco dell'ERP?
Massimale indicativo?
> *(→ `business_impact_analysis.cyber_insurance_coverage`)*

---

**B5.** Obblighi legali e normativi legati all'ERP:
- GDPR: l'ERP gestisce dati personali di clienti o dipendenti?
- NIS2: siete classificati come entità Essential o Important?
- SOX (Sarbanes-Oxley): applicabile per società quotate?
- Requisiti fiscali locali: e-fattura, SDI, conservazione a norma 10 anni?
> *(→ `business_impact_analysis.legal_implications`)*

---

**B6.** RTO e RPO:
- Entro quante ore dovete ripristinare l'ERP per non interrompere la fatturazione?
- Quante ore di dati (transazioni) potete permettervi di perdere?
> *(→ `recovery_objectives.rto_hours`, `.rpo_hours`)*

---

**B7.** Avete mai eseguito un test di disaster recovery sull'ERP?
Se sì, quanto tempo ha richiesto il ripristino effettivo?
> *(→ `recovery_objectives.last_bcp_drill`, `.bcp_drill_result`)*

---

**B8.** Soglia di notifica al board:
A quale livello di degrado del sistema volete che scatti un'allerta automatica al management?
> *(→ `business_impact_analysis.board_notification_threshold`)*

---

## BLOCCO C — Architettura e Contesto Tecnologico
*Obiettivo: capire dove vive l'ERP e come si connette al resto.*

---

**C1.** L'ERP è installato su:
- Server fisici in sede (on-premise)?
- Macchine virtuali (VMware, Hyper-V) in datacenter interno?
- Cloud privato (es. SAP HANA Enterprise Cloud)?
- Cloud pubblico (Azure, AWS, GCP) — managed by SAP o self-managed?
- SaaS (SAP S/4HANA Cloud, Dynamics 365 Online)?
> *(→ `ot_context.asset_type` — IT | Cloud | Hybrid)*

---

**C2.** Il database dell'ERP (es. HANA, Oracle, SQL Server, DB2):
- È sullo stesso server o su server separato?
- Chi gestisce i backup del database?
- Dov'è fisicamente il datacenter (sede, provider esterno, quale paese)?
> *(→ `graph_edges[]` STORES_DATA_IN, `ot_context.air_gap_status`)*

---

**C3.** Quanti sistemi satellite si connettono all'ERP?
Per ognuno: invia dati, riceve dati, o entrambi? Qual è il protocollo?

Esempi da esplorare:
| Sistema | Direzione | Protocollo noto? |
|---|---|---|
| MES / Gestionale produzione | ↑↓ | RFC / IDoc / REST |
| CRM (Salesforce, ecc.) | ↑↓ | ? |
| Portale e-commerce / EDI | → | ? |
| Business Intelligence / BW | → | ? |
| Banca / tesoreria | → | ? |
| Dogane / fatturazione elettronica | → | ? |
| Active Directory / SSO | → | LDAP/Kerberos/SAML |

> *(→ `graph_edges[]`: type, protocol, direction, criticality)*

---

**C4.** Ci sono connessioni RFC tra sistemi SAP?
(es. ECC → BW, ECC → CRM, sandbox → produzione)
Sono ancora tutte necessarie o ce ne sono di obsolete aperte?
> *(→ `graph_edges[]` tipo FEEDS_DATA_TO, note su RFC obsolete)*

---

**C5.** Per ogni integrazione elencata: cosa succederebbe operativamente
se quella comunicazione venisse tagliata durante un attacco?
> *(→ `graph_edges[].severance_impact`)*

---

**C6.** Le comunicazioni con i sistemi elencati sono cifrate (HTTPS, TLS, SNC)?
L'accesso ai sistemi remoti richiede autenticazione forte?
> *(→ `graph_edges[].encrypted`, `.mutually_authenticated`)*

---

## BLOCCO D — Controlli di Sicurezza Attivi
*Obiettivo: capire quali protezioni ci sono oggi.*

---

**D1. EDR / Antivirus sui server SAP**
Sui server dell'ERP c'è un EDR o antivirus?
SAP supporta gli EDR sulla propria piattaforma (SAP ha limitazioni specifiche)?
> *(→ `security_controls[]` CTRL-ERP-EDR)*

---

**D2. Autenticazione e Segregazione dei Ruoli (SoD)**
- Per accedere all'ERP serve username+password o anche MFA?
- Esistono utenti con accesso completo a tutto il sistema (SAP_ALL, SUPER_USER)?
- Avete uno strumento per controllare i conflitti di ruolo (Segregation of Duties)?
  - es. un utente può sia creare fornitori che approvare pagamenti? (rischio frode)
- Gli account di servizio (batch, interfacce) hanno password che scadono?

> *(→ `security_controls[]` CTRL-ERP-MFA, CTRL-ERP-SOD)*

**Domande di approfondimento SoD:**
- Chi esegue il review periodico delle autorizzazioni SAP?
- Quanti utenti hanno transazioni critiche (F110 - pagamenti automatici, SCC5 - delete client)?
- I manutentori del system integrator hanno accesso al sistema di produzione?
  Con quale tipo di accesso? È tracciato?

---

**D3. Backup e Ripristino**
- Il database SAP viene backuppato con quale frequenza? (HANA Backint, BRBACKUP, ecc.)
- I backup sono su storage separato fisicamente?
- Avete mai ripristinato un backup completo in ambiente test per verificare che funzioni?
- Quanto tempo ha richiesto il ripristino nel test?
> *(→ `security_controls[]` CTRL-ERP-BACKUP)*

---

**D4. Patch e Transport Management**
- Con quale frequenza applicate i SAP Support Package?
- Chi decide quando applicare una patch critica (SAP Security Notes)?
- I trasporti dal sistema di sviluppo a produzione passano da un sistema di test?
  C'è un processo formale di change management?
- Ci sono SAP Security Notes critiche aperte da più di 90 giorni?
> *(→ `security_controls[]` CTRL-ERP-PATCH)*

---

**D5. Log e Monitoraggio SAP**
- Il SAP Security Audit Log (SM20) è attivo? Cosa registra?
- I log SAP vengono estratti e inviati a un SIEM centralizzato?
- Qualcuno monitora gli accessi anomali all'ERP (es. login fuori orario, transazioni inusuali)?
- Il Change Document Log (tabelle CDHDR/CDPOS) viene archiviato?
> *(→ `security_controls[]` CTRL-ERP-LOGGING)*

---

**D6. Segmentazione di Rete**
- I server SAP sono in una VLAN/segmento di rete dedicato?
- L'accesso alla GUI SAP (port 3200 o HTTPS/443) è filtrato per IP sorgente?
- Il sistema di sviluppo/test è isolato dalla rete di produzione?
> *(→ `security_controls[]` CTRL-ERP-NETISO)*

---

**D7. Gestione delle Eccezioni**
- Ci sono account con SAP_ALL o privilegi equivalenti in produzione "temporanei" da mesi?
- Ci sono porte aperte o connessioni RFC attive che nessuno sa più perché esistono?
> *(→ `security_controls[].exception` per ogni controllo con eccezione attiva)*

---

## BLOCCO E — Resilienza Operativa
*Obiettivo: capire cosa fate concretamente se l'ERP cade.*

---

**E1.** Se l'ERP si bloccasse adesso, come continuate a operare?
- Fatturazione: potete emettere fatture manualmente (PDF, carta)?
- Ordini cliente: potete prenderli via email/telefono?
- Pagamenti fornitori: avete accesso diretto al portale bancario senza ERP?
- Produzione: avete un MES indipendente o dipende dai piani di produzione SAP (MRP)?

Per quanto tempo reggerebbe questo workaround?
> *(→ `ot_context.degraded_mode_max_minutes`, `failure_management.business_workaround`)*

---

**E2.** Per ogni workaround: quali altri sistemi devono funzionare per poterlo eseguire?
(es. "usiamo il file Excel ma serve accedere al NAS", "chiamiamo il responsabile ma ha i dati solo su SAP")
> *(→ `failure_management.workaround_dependencies`)*

---

**E3.** Esiste un documento/playbook che descrive passo-passo cosa fare in caso di blocco dell'ERP?
Chi lo conosce? Dove si trova?
> *(→ `failure_management.incident_playbook_ref`)*

---

**E4.** Scenario Ransomware — ERP cifrato questa notte:
1. Chi chiamerete per primo? (interno / system integrator / SAP support?)
2. Avete un contratto di supporto prioritario con SAP (SAP Enterprise Support)?
3. Avete una copia dell'ambiente di produzione in standby (secondary landscape)?
4. Quanto tempo ci vuole per un full restore del database HANA/Oracle da zero?
> *(→ valida `rto_hours` e solidità di `failure_management`)*

---

**E5.** Nel caso peggiore — ripristino da zero:
- Avete le licenze software documentate e recuperabili?
- Avete i media di installazione o l'accesso SAP Download Center?
- La documentazione delle customizzazioni è aggiornata (LSMW, user exits, BADIs)?
> *(→ affina `bcp_drill_result` e `rto_hours`)*

---

## BLOCCO F — Finanziario e Audit (specifico ERP)
*Obiettivo: valutare i rischi di frode, compliance finanziaria e conservazione dati.*

---

**F1.** Segregazione dei Doveri — conflitti critici:
Verificate che nessun singolo utente abbia contemporaneamente:
- Creazione fornitore + approvazione pagamento?
- Creazione ordine d'acquisto + ricevimento merce + approvazione fattura?
- Accesso a tabelle di configurazione prezzi + immissione ordini clienti?

Avete uno strumento GRC che monitora questi conflitti in tempo reale?
> *(→ `security_controls[]` CTRL-ERP-SOD; eccezioni attive)*

---

**F2.** Audit trail e conservazione dati:
- Per quanti anni conservate i documenti fiscali nell'ERP?
- I documenti sono conservati in modo non modificabile (immutabilità)?
- Dove vengono archiviati i dati storici (SAP ILM, archivio esterno)?
> *(→ `business_impact_analysis.legal_implications`)*

---

**F3.** Utenti privilegiati e access review:
- Con quale frequenza fate un review formale di chi ha accesso a cosa?
- Esiste una procedura di deprovisioning automatica quando un dipendente lascia?
- I consulenti/system integrator hanno ancora accesso a sistemi di produzione a progetto finito?
> *(→ `security_controls[]` CTRL-ERP-MFA con nota su account review)*

---

**F4.** Accesso da remoto:
- I manutentori SAP accedono da remoto? Tramite VPN, Citrix, SAP Solution Manager?
- L'accesso remoto è registrato e revocabile immediatamente?
- C'è un processo per approvare e terminare le sessioni di manutenzione remota?
> *(→ `graph_edges[]` tipo ACCESSED_VIA, `security_controls[]` CTRL-ERP-REMOTE)*

---

## BLOCCO G — Contesto per l'AI (Narrativa di Rischio)
*Obiettivo: raccogliere il "perché" narrativo per le analisi AI.*

---

**G1.** In una frase: perché l'ERP è vitale per l'azienda?
Cosa succede al business se non c'è per 24 ore? Per una settimana?
> *(→ `reasoning_for_ai.logic_inference`)*

---

**G2.** Se l'ERP cadesse, quali altri sistemi o processi smetterebbero di funzionare a cascata?
(es. "prima si bloccano gli ordini, poi la produzione non sa cosa produrre, poi i clienti non ricevono le conferme, poi la logistica non può spedire")
> *(→ `reasoning_for_ai.failure_cascading_effect`)*

---

**G3.** Comportamenti rischiosi da evitare sull'ERP:
(es. "non dare le credenziali SAP ai consulenti", "non aprire allegati dall'application server", "non usare SAP_ALL in produzione anche se urgente")
> *(→ `reasoning_for_ai.training_notes`)*

---

**G4.** 3–5 parole chiave che catturano l'essenza di rischio di questo sistema:
> *(→ `reasoning_for_ai.semantic_tags` — clustering RAG)*

---

## BLOCCO H — Verifica Finale e Gap Aperti

| Campo BASM | Stato | Note |
|---|---|---|
| `identity_context` completo con moduli SAP attivi | ☐ | |
| `hourly_downtime_cost` > 0 con stima motivata | ☐ | |
| `rto_hours` / `rpo_hours` realistici e testati | ☐ | |
| `security_controls` ≥ 6 (EDR, MFA, SoD, Backup, Patch, Log) | ☐ | |
| Conflitti SoD mappati o dichiarati inesistenti | ☐ | |
| Account privilegiati (SAP_ALL, BASIS) censiti | ☐ | |
| `graph_edges` per ogni sistema collegato (almeno 4) | ☐ | |
| Conservazione dati fiscali verificata | ☐ | |
| `reasoning_for_ai` narrativo compilato | ☐ | |
| Eccezioni di sicurezza documentate | ☐ | |
| Playbook incident response referenziato | ☐ | |

---

**Punteggio BASM stimato post-intervista:**

| Blocco | Peso | Score stimato |
|---|---|---|
| A — Identità | 10% | /10 |
| B — Business Impact | 20% | /20 |
| C — Architettura | 15% | /15 |
| D — Controlli | 25% | /25 |
| E — Resilienza | 15% | /15 |
| F — Finanziario/Audit | 10% | /10 |
| G — Narrativa AI | 5% | /5 |
| **TOTALE** | **100%** | **/100** |

---

*Template BASM v3.0-DIGITAL-TWIN — Interview Guide ERP/SAP*
*Generato: 2026-03-08 | Per uso interno — classificazione: CONFIDENTIAL*
