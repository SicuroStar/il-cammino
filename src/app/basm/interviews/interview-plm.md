# Intervista BASM — PLM / CAD (Product Lifecycle Management, Proprietà Intellettuale)
**Template di intervista strutturata per compilare il BASM v3.0 a 100/100**

---

> **Come usare questo documento**
> Ogni domanda riporta tra parentesi il campo JSON che popola.
> Rispondi liberamente — non servono risposte tecniche precise.
> L'intervistatore traduce le tue risposte nei valori corretti.
> Tempo stimato: 45–60 minuti.
> **Referente ideale:** Responsabile R&D, Responsabile Engineering, CTO, Responsabile IT applicativi.
>
> ⚠️ **Nota speciale:** Il PLM contiene la proprietà intellettuale dell'azienda —
> i progetti, i disegni, le specifiche tecniche, i modelli 3D.
> Per un'azienda manifatturiera come Interroll, è il "cervello" del prodotto.
> Un attaccante che ruba i dati PLM ruba anni di ricerca e sviluppo.

---

## BLOCCO A — Identità e Responsabilità
*Obiettivo: capire chi possiede il sistema e perché esiste.*

---

**A1.** Come si chiama ufficialmente il sistema PLM/PDM che gestiamo oggi?
Fornitore e versione? (es. PTC Windchill 13, Siemens Teamcenter 2312, Dassault ENOVIA, Autodesk Vault, SolidWorks PDM)
> *(→ `identity_context.name`, `ot_context.firmware.current_version`)*

---

**A2.** Chi è il responsabile di business di questa applicazione?
Se il PLM si bloccasse e gli ingegneri non potessero accedere ai disegni, chi risponde al CTO?
> *(→ `identity_context.business_owner.name`, `.department`, `.contact`)*

---

**A3.** Chi è il responsabile tecnico (PLM Admin, CAD Admin)?
È un team interno o un system integrator specializzato?
> *(→ `identity_context.technical_lead`)*

---

**A4.** Classificazione criticità:

- 🔴 **Tier-1 Gold** — Senza PLM l'R&D si blocca, non si possono modificare i prodotti in produzione
- 🟡 **Tier-2 Silver** — Gli ingegneri possono lavorare su copie locali per qualche giorno
- 🟢 **Tier-3 Bronze** — Il PLM è usato per archivio storico, la produzione non dipende dalla sua disponibilità real-time

> *(→ `identity_context.criticality_class`)*

---

## BLOCCO B — Impatto sul Business
*Obiettivo: quantificare in euro cosa succede se il PLM cade o i dati vengono rubati.*

---

**B1.** Quali processi aziendali dipendono da questo sistema?
(es. "i progettisti scaricano i disegni qui", "le istruzioni di montaggio vengono generate da qui",
"le distinte base (BOM) vengono trasferite all'ERP", "i fornitori accedono alle specifiche tecniche da qui")
> *(→ `business_impact_analysis.process_chain`)*

---

**B2.** Se il PLM fosse completamente inaccessibile per 1 ora — per 1 giorno:
- Quanti ingegneri/progettisti non possono lavorare?
- La produzione si blocca o può continuare con i disegni già stampati/scaricati?
- I lanci di nuovi prodotti o le modifiche urgenti alle linee vengono bloccati?

Stima euro/ora:
> *(→ `business_impact_analysis.hourly_downtime_cost`)*

---

**B3.** Scenario peggiore — furto di dati (data exfiltration):
Se un attaccante rubasse tutti i dati del PLM (disegni, modelli 3D, specifiche, BOM):
- Qual è il valore stimato della proprietà intellettuale?
- I concorrenti potrebbero replicare i vostri prodotti?
- Violereste obblighi contrattuali di riservatezza con i clienti?
> *(→ nota critica per `reasoning_for_ai.failure_cascading_effect`)*

---

**B4.** Avete una polizza cyber che copre la perdita di proprietà intellettuale?
La polizza distingue tra "furto di dati" e "interruzione del sistema"?
> *(→ `business_impact_analysis.cyber_insurance_coverage`)*

---

**B5.** Obblighi legali e normativi legati al PLM:
- Accordi di riservatezza (NDA) con clienti che richiedono protezione dei dati tecnici?
- Export Control / ITAR / EAR (per prodotti a doppio uso o con componenti regolamentati)?
- GDPR: il PLM gestisce dati personali? (es. contatti tecnici, dipendenti nei workflow)
- ISO 9001: la gestione dei documenti tecnici è un requisito del sistema qualità?
- Requisiti di conservazione: per quanto tempo devono essere conservati i disegni tecnici?
> *(→ `business_impact_analysis.legal_implications`)*

---

**B6.** RTO e RPO:
- Entro quante ore dovete ripristinare il PLM per non bloccare l'R&D o la produzione?
- Quante ore di lavoro (modifiche, approvazioni, rilasci) potete perdere?
> *(→ `recovery_objectives.rto_hours`, `.rpo_hours`)*

---

**B7.** Avete mai testato il disaster recovery del PLM?
Avete verificato che il ripristino del vault funzioni correttamente?
> *(→ `recovery_objectives.last_bcp_drill`, `.bcp_drill_result`)*

---

**B8.** Soglia di allerta al management:
> *(→ `business_impact_analysis.board_notification_threshold`)*

---

## BLOCCO C — Architettura e Contesto Tecnologico
*Obiettivo: capire dove vive il PLM e come si connette al resto.*

---

**C1.** Il PLM è installato su:
- Server fisico on-premise (vault server, database server)?
- Cloud (PTC Atlas, Siemens Xcelerator Cloud, Autodesk Platform Services)?
- Ibrido (vault on-premise + collaborazione cloud)?
> *(→ `ot_context.asset_type` — IT | Cloud | Hybrid)*

---

**C2.** Il database del PLM (Oracle, SQL Server, PostgreSQL):
- Dove è installato? Stesso server o separato?
- Chi gestisce i backup?
- Quanto sono grandi i dati del vault? (indicativo: GB o TB?)
> *(→ `graph_edges[]` STORES_DATA_IN)*

---

**C3.** Con quali sistemi si connette il PLM?
Per ognuno: cosa si scambia, con quale protocollo, e cosa succede se si interrompe.

| Sistema | Scambio dati | Protocollo | Criticità |
|---|---|---|---|
| CAD (CATIA, SolidWorks, NX, Creo) | Salvataggio/recupero file | Client API / WebDAV | Critical |
| ERP (SAP / Dynamics) | Distinta base (BOM), codici articolo | REST/SOAP/IDOC | High |
| MES / Produzione | Istruzioni di lavoro, disegni di produzione | REST / file share | Medium/High |
| Portale fornitori / Extranet | Specifiche tecniche condivise con fornitori | HTTPS / portale web | Medium |
| DMS (Document Management) | Documentazione qualità, manuali | REST / CMIS | Medium |
| Active Directory / SSO | Autenticazione utenti | LDAP / SAML | High |
| Sistema di gestione qualità (FMEA, APQP) | Legami tra progetto e qualità | ? | Medium |

> *(→ `graph_edges[]`: type, protocol, direction, criticality)*

---

**C4.** Accesso fornitori/partner esterni:
- I fornitori esterni accedono al PLM per scaricare specifiche?
- Se sì: tramite portale dedicato o accesso diretto al sistema?
- Come vengono autenticati i fornitori? Hanno account nominali?
- Cosa vedono i fornitori? Solo le parti che li riguardano o tutto?
> *(→ `graph_edges[]` tipo SHARES_DATA_WITH, nota su data classification)*

---

**C5.** Per ogni connessione: cosa succede operativamente se si interrompe?
> *(→ `graph_edges[].severance_impact`)*

---

**C6.** Le comunicazioni con i sistemi elencati sono cifrate?
Il PLM usa HTTPS/TLS per il client? I trasferimenti file verso fornitori sono su canale sicuro?
> *(→ `graph_edges[].encrypted`, `.mutually_authenticated`)*

---

## BLOCCO D — Controlli di Sicurezza Attivi
*Obiettivo: valutare le protezioni specifiche per la proprietà intellettuale.*

---

**D1. EDR / Antivirus sui server PLM**
Sui server PLM c'è un EDR o antivirus?
È compatibile con il software PLM? Il fornitore lo supporta?
> *(→ `security_controls[]` CTRL-PLM-EDR)*

---

**D2. Autenticazione e Controllo Accessi**
- Per accedere al PLM serve username+password o anche MFA?
- Gli accessi sono granulari (un progettista vede solo i progetti del suo team)?
  O tutti vedono tutto?
- Chi può approvare e rilasciare i documenti (workflow di revisione)?
- I fornitori esterni hanno accesso limitato solo ai dati che li riguardano (data room separata)?
> *(→ `security_controls[]` CTRL-PLM-MFA, CTRL-PLM-ACCESSCTRL)*

**Domande di approfondimento:**
- Esiste un processo di deprovisioning automatico per chi lascia l'azienda?
- I consulenti/design partner hanno ancora accesso dopo la fine del progetto?
- Chi monitora i download massivi di file dal PLM?

---

**D3. Data Loss Prevention (DLP)**
- Avete un sistema che rileva o blocca l'invio massivo di file CAD/PLM verso l'esterno?
  (upload su cloud personale, invio via email di file di grandi dimensioni, copia su USB)
- I file CAD hanno watermark digitali o sono tracciabili in caso di leak?
- Avete mai avuto episodi di file aziendali trovati su reti di condivisione esterne?
> *(→ `security_controls[]` CTRL-PLM-DLP)*

---

**D4. Backup del Vault**
- I file del vault PLM (disegni, modelli, metadati) vengono backuppati?
- Con quale frequenza? Il backup include anche il database PLM?
- I backup sono su storage fisicamente separato o offline?
- Avete mai verificato l'integrità di un backup PLM ripristinandolo in ambiente test?
> *(→ `security_controls[]` CTRL-PLM-BACKUP)*

---

**D5. Patch e Aggiornamenti**
- Il software PLM viene aggiornato regolarmente?
- Chi gestisce gli aggiornamenti (IT interno, system integrator, vendor)?
- Gli aggiornamenti vengono testati in ambiente sandbox prima della produzione?
> *(→ `security_controls[]` CTRL-PLM-PATCH)*

---

**D6. Log e Monitoraggio**
- Il PLM registra chi ha scaricato, modificato o cancellato file?
- I log vengono conservati? Per quanto tempo?
- Esistono alert automatici per comportamenti anomali?
  (es. utente scarica 500 file in 10 minuti, accesso fuori orario, download da IP estero)
> *(→ `security_controls[]` CTRL-PLM-LOGGING)*

---

**D7. Classificazione dei Dati**
- I dati nel PLM sono classificati per livello di sensibilità?
  (es. Public / Internal / Confidential / Restricted)
- I disegni di prodotti soggetti a Export Control sono separati e con accesso ristretto?
- Esistono documenti con restrizioni ITAR/EAR nel PLM?
> *(→ `security_controls[]` CTRL-PLM-CLASSIFICATION)*

---

**D8. Gestione delle Eccezioni**
- Ci sono utenti con accesso globale al vault (tutti i progetti) che non dovrebbero averlo?
- Ci sono fornitori con account attivi su progetti già conclusi?
- Ci sono file condivisi tramite link pubblici o cartelle cloud non gestite?
> *(→ `security_controls[].exception`)*

---

## BLOCCO E — Resilienza Operativa
*Obiettivo: cosa fate se il PLM cade o i dati vengono cifrati/rubati.*

---

**E1.** Se il PLM fosse completamente inaccessibile, come lavorano gli ingegneri?
- Hanno copie locali aggiornate dei file su cui stanno lavorando?
- Per quanto tempo possono operare prima che il lavoro si blocchi?
- La produzione può continuare con i disegni già rilasciati (stampati, salvati in PDF)?
> *(→ `ot_context.degraded_mode_max_minutes`, `failure_management.business_workaround`)*

---

**E2.** Per il workaround: quali altri sistemi devono funzionare?
(es. "usiamo file locali ma serve la VPN per accedere al file server", "usiamo PDF ma serve la stampante di rete")
> *(→ `failure_management.workaround_dependencies`)*

---

**E3.** Esiste un playbook per:
- Blocco del PLM (server down, database corrotto)?
- Ransomware che cifra il vault?
- Data breach (sospetto furto di disegni tecnici)?
> *(→ `failure_management.incident_playbook_ref`)*

---

**E4.** Scenario Data Breach — scoprite che un ex-dipendente ha scaricato tutto il vault:
1. Come rilevate l'esfiltrazione? Avete i log?
2. Chi notificate? (Legal, CISO, CEO, clienti?)
3. Avete un piano di risposta agli incidenti che include il furto di IP?
4. Avete mai fatto un esercizio tabletop su questo scenario?
> *(→ valida la maturità della risposta agli incidenti per dati IP)*

---

**E5.** Ripristino da zero — vault PLM distrutto:
- Avete backup recenti testati?
- Quanto tempo richiederebbe il ripristino completo?
- I metadati (workflow, relazioni tra documenti) vengono backuppati insieme ai file?
> *(→ affina `rto_hours` e `bcp_drill_result`)*

---

## BLOCCO F — Proprietà Intellettuale e Compliance (specifico PLM)
*Obiettivo: valutare i rischi specifici legati all'IP e alla conformità normativa.*

---

**F1.** Valore e perimetro della proprietà intellettuale:
- Quali categorie di IP contiene il PLM?
  (Disegni 2D/3D, modelli di simulazione, algoritmi di controllo, brevetti, know-how di processo)
- Quali sono i prodotti/componenti più strategici (più copiabili da un concorrente)?
- Avete depositato brevetti? Il PLM documenta il percorso di sviluppo come prior art?
> *(→ nota per `reasoning_for_ai.logic_inference`)*

---

**F2.** Export Control:
- I vostri prodotti o componenti sono soggetti a normative di Export Control?
  (ITAR — International Traffic in Arms Regulations; EAR — Export Administration Regulations; normativa UE dual-use)
- I dati soggetti a Export Control nel PLM sono segregati e con accesso ristretto a personale autorizzato?
- I fornitori esteri che accedono al PLM sono verificati rispetto alle liste di controllo delle esportazioni?
> *(→ `business_impact_analysis.legal_implications`, `security_controls[]` CTRL-PLM-EXPORTCTRL)*

---

**F3.** Gestione del ciclo di vita dei documenti:
- Esiste un processo formale di revisione, approvazione e rilascio dei documenti tecnici?
- Chi può rilasciare (release) un disegno che va in produzione?
- I documenti obsoleti vengono ritirati e sostituiti in modo tracciabile?
- La cronologia completa delle revisioni è conservata (audit trail delle modifiche)?
> *(→ `security_controls[]` CTRL-PLM-DOCCTRL)*

---

**F4.** Collaborazione con fornitori e partner:
- Come condividete le specifiche tecniche con i fornitori (componenti, lavorazioni conto terzi)?
- I fornitori firmano NDA prima di ricevere accesso ai dati tecnici?
- C'è un sistema per revocare l'accesso a un fornitore con cui si interrompe la collaborazione?
- Monitorate cosa fanno i fornitori nel PLM (accessi, download)?
> *(→ `graph_edges[]` tipo SHARES_DATA_WITH, `security_controls[]` CTRL-PLM-SUPPLIERCTRL)*

---

## BLOCCO G — Contesto per l'AI (Narrativa di Rischio)
*Obiettivo: raccogliere il "perché" narrativo per le analisi AI.*

---

**G1.** In una frase: perché il PLM è una crown jewel per l'azienda?
Cosa rappresenta il vault PLM in termini di valore aziendale?
> *(→ `reasoning_for_ai.logic_inference`)*

---

**G2.** Se i dati PLM fossero rubati o distrutti, qual è l'effetto a cascata?
(es. "i concorrenti potrebbero copiare il prodotto, la produzione si blocca perché non ha disegni aggiornati,
i clienti scoprono che i loro dati tecnici sono stati esposti")
> *(→ `reasoning_for_ai.failure_cascading_effect`)*

---

**G3.** Comportamenti rischiosi da evitare:
(es. "non inviare file CAD via email personale", "non salvare disegni su Dropbox/Google Drive personale",
"non dare accesso PLM ai fornitori prima che firmino l'NDA")
> *(→ `reasoning_for_ai.training_notes`)*

---

**G4.** 3–5 parole chiave che catturano l'essenza di rischio di questo sistema:
> *(→ `reasoning_for_ai.semantic_tags`)*

---

## BLOCCO H — Verifica Finale e Gap Aperti

| Campo BASM | Stato | Note |
|---|---|---|
| `identity_context` completo con fornitore e versione PLM | ☐ | |
| `hourly_downtime_cost` > 0 con stima ingegneri bloccati | ☐ | |
| Valore IP stimato e documentato | ☐ | |
| Export Control applicabile verificato (sì/no) | ☐ | |
| `security_controls` ≥ 7 (EDR, MFA, DLP, Backup, Patch, Log, Classification) | ☐ | |
| Accessi fornitori esterni censiti e revocabili | ☐ | |
| `graph_edges` per CAD, ERP, MES, portale fornitori | ☐ | |
| Data breach playbook referenziato | ☐ | |
| `reasoning_for_ai` con valore IP e effetto cascata | ☐ | |
| Eccezioni attive (fornitori ex-progetto, accessi globali) documentate | ☐ | |
| Cronologia revisioni documenti e audit trail verificati | ☐ | |

---

**Punteggio BASM stimato post-intervista:**

| Blocco | Peso | Score stimato |
|---|---|---|
| A — Identità | 10% | /10 |
| B — Business Impact | 20% | /20 |
| C — Architettura | 15% | /15 |
| D — Controlli | 20% | /20 |
| E — Resilienza | 15% | /15 |
| F — IP e Compliance | 15% | /15 |
| G — Narrativa AI | 5% | /5 |
| **TOTALE** | **100%** | **/100** |

---

*Template BASM v3.0-DIGITAL-TWIN — Interview Guide PLM/CAD*
*Generato: 2026-03-08 | Per uso interno — classificazione: CONFIDENTIAL*
