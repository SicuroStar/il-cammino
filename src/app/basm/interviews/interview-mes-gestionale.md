# Intervista BASM — Gestionale Produzione / Conta Pezzi (MES/ERP)
**Template di intervista strutturata per compilare il BASM v3.0 a 100/100**

---

> **Come usare questo documento**
> Ogni domanda riporta tra parentesi il campo JSON che popola.
> Rispondi liberamente — non servono risposte tecniche precise.
> L'intervistatore traduce le tue risposte nei valori corretti.
> Tempo stimato: 45–60 minuti.

---

## BLOCCO A — Identità e Responsabilità
*Obiettivo: capire chi possiede il sistema e perché esiste.*

---

**A1.** Come si chiama ufficialmente il sistema che gestiamo oggi?
Ha un nome interno, un nome del fornitore, un soprannome in reparto?
> *(→ `identity_context.name`)*

---

**A2.** Chi è il responsabile di business di questa applicazione?
Cioè: se il sistema si fermasse alle 14:00 di un lunedì, chi riceve la chiamata e deve rispondere al Direttore Generale?
> *(→ `identity_context.business_owner.name`, `.department`, `.contact`)*

---

**A3.** Chi è il responsabile tecnico che conosce l'applicazione nel dettaglio?
Chi chiamerebbe il business owner in caso di guasto?
> *(→ `identity_context.technical_lead`)*

---

**A4.** Se doveste classificare questo sistema su una scala di criticità aziendale,
dove lo mettete?

- 🔴 **Tier-1 Gold** — Se si ferma, si ferma la produzione o la fatturazione
- 🟡 **Tier-2 Silver** — Se si ferma, c'è un workaround manuale per qualche ora
- 🟢 **Tier-3 Bronze** — Se si ferma, ci accorgiamo il giorno dopo

> *(→ `identity_context.criticality_class`)*

---

## BLOCCO B — Impatto sul Business
*Obiettivo: quantificare in euro cosa succede se il sistema cade.*

---

**B1.** Questo sistema fa parte di quale processo aziendale principale?
(es. "confermiamo gli ordini di produzione", "chiudiamo i lotti", "fatturiamo al cliente")
> *(→ `business_impact_analysis.process_chain`)*

---

**B2.** Se questo sistema fosse completamente indisponibile per 1 ora durante la produzione,
quanto stimereste il costo diretto? (produzione ferma, operatori inattivi, ordini bloccati)

Aiuto per la stima:
- Quanti operatori dipendono da questo sistema? × costo orario medio
- Quante unità/pezzi si producono all'ora? × margine per pezzo
- C'è un ritardo di consegna con penali contrattuali?

> *(→ `business_impact_analysis.hourly_downtime_cost`)*

---

**B3.** Avete una polizza assicurativa cyber che coprirebbe un'interruzione di questo sistema?
Se sì, qual è il massimale indicativo?
> *(→ `business_impact_analysis.cyber_insurance_coverage`)*

---

**B4.** Quali obblighi legali o normativi vi preoccupano di più per questo sistema?
(es. GDPR, NIS2, certificazioni ISO, requisiti cliente, direttive settoriali)
> *(→ `business_impact_analysis.legal_implications`)*

---

**B5.** Se il sistema si interrompesse oggi, entro quanto tempo **dovete** averlo ripristinato
per non impattare seriamente la produzione o i clienti?

- RTO (Recovery Time Objective): entro quante ore deve tornare su?
- RPO (Recovery Point Objective): quanti minuti/ore di dati potete permettervi di perdere?

> *(→ `business_impact_analysis.recovery_objectives.rto_hours`, `.rpo_hours`)*

---

**B6.** Avete mai testato un ripristino reale di questo sistema (BCP drill, disaster recovery test)?
Se sì, quando? È andato bene o avete trovato problemi?
> *(→ `recovery_objectives.last_bcp_drill`, `.bcp_drill_result`)*

---

**B7.** A che soglia di rischio volete che il sistema invii automaticamente un'allerta al management?
(es. "se la sicurezza di questo sistema scende sotto il 50%, voglio saperlo subito")
> *(→ `business_impact_analysis.board_notification_threshold`)*

---

## BLOCCO C — Architettura e Contesto Tecnologico
*Obiettivo: capire dove vive il sistema e come si connette al resto.*

---

**C1.** Questo sistema è installato su:
- Server fisico in sede?
- Macchina virtuale (VMware, Hyper-V)?
- Cloud (Azure, AWS, Google)?
- SaaS (il fornitore lo gestisce in cloud)?
- Combinazione di più ambienti?

> *(→ `ot_context.asset_type`, determina se OT/IT/Cloud)*

---

**C2.** Il sistema parla direttamente con macchine di produzione (PLC, SCADA, sensori)?
O solo con altri sistemi informativi (ERP, database, BI)?

Se parla con macchine: usate protocolli come OPC-UA, Profinet, Modbus, S7?
> *(→ `ot_context.purdue_level` — se MES è Purdue L3; se ERP è L4)*

---

**C3.** La rete dove vive questo sistema è separata dalla rete di produzione (OT)?
O sono sulla stessa rete?
> *(→ `ot_context.air_gap_status`)*

---

**C4.** Il sistema ha un suo database? Se sì, dove è installato?
Stesso server? Server separato? Cloud? Chi lo gestisce?
> *(→ popola `graph_edges` con edge tipo `STORES_DATA_IN`)*

---

**C5.** Con quali altri sistemi comunica questa applicazione?
Per ognuno dite: invia dati, riceve dati, o entrambi?

Esempi da esplorare:
| Sistema | Direzione | Protocollo noto? |
|---|---|---|
| SAP / ERP principale | ↑↓ | ? |
| MES / schedulazione | ↑↓ | ? |
| PLC / SCADA | ↑↓ | ? |
| Active Directory / Login | → | ? |
| Backup / NAS | → | ? |
| Portale fornitore / cliente | ↑↓ | ? |

> *(→ `graph_edges[]`: type, protocol, direction, criticality)*

---

**C6.** Per ognuna delle connessioni sopra: se quella comunicazione venisse interrotta
durante un attacco, cosa succederebbe operativamente?
> *(→ `graph_edges[].severance_impact`)*

---

**C7.** Le comunicazioni con i sistemi elencati sono cifrate (HTTPS, VPN, TLS)?
Richiedono autenticazione reciproca (certificati, token)?
> *(→ `graph_edges[].encrypted`, `.mutually_authenticated`)*

---

## BLOCCO D — Controlli di Sicurezza Attivi
*Obiettivo: capire quali protezioni ci sono oggi e quanto le conoscete.*

Per ogni area sottostante, indicate: **esiste / non esiste / non so**.

---

**D1. Antivirus / EDR**
Sui server di questa applicazione c'è un antivirus o un sistema di rilevamento avanzato (EDR)?
Se sì, quale prodotto? È aggiornato? Chi controlla gli alert?
> *(→ `security_controls[]` per CTRL-EDR)*

**Domande di approfondimento:**
- Chi riceve le notifiche di alert dell'antivirus?
- Quando è stato fatto l'ultimo aggiornamento delle firme?
- Esiste un processo per rispondere agli alert?

---

**D2. Autenticazione e Accessi (MFA)**
Per accedere a questo sistema serve solo username+password o c'è un secondo fattore (SMS, app, token)?
Chi può accedere? Solo operatori interni o anche fornitori/manutentori esterni?
> *(→ `security_controls[]` per CTRL-MFA)*

**Domande di approfondimento:**
- Esistono account condivisi (es. "admin" usato da più persone)?
- Gli accessi degli utenti vengono rimossi quando qualcuno lascia l'azienda?
- I manutentori del fornitore come accedono? Con accesso diretto o tramite voi?

---

**D3. Backup**
I dati di questo sistema vengono copiati regolarmente?
- Con quale frequenza?
- I backup sono salvati in un posto diverso dal server principale?
- Avete mai provato a ripristinare da un backup? Ha funzionato?
> *(→ `security_controls[]` per CTRL-BACKUP; `graph_edges[]` per edge BACKUP_OF)*

---

**D4. Patch e Aggiornamenti**
Il sistema operativo del server e l'applicazione stessa vengono aggiornati regolarmente?
- Chi se ne occupa?
- Con quale frequenza?
- Ci sono patch critiche in attesa da più di 30 giorni?
> *(→ `security_controls[]` per CTRL-PATCH)*

---

**D5. Log e Monitoraggio**
Gli accessi e le operazioni su questo sistema vengono registrati (log)?
- I log vengono conservati per quanto tempo?
- Qualcuno li controlla? Automaticamente o manualmente?
- In caso di incidente, riuscireste a ricostruire cosa è successo guardando i log?
> *(→ `security_controls[]` per CTRL-LOGGING)*

---

**D6. Segmentazione di Rete**
Questo sistema può essere raggiunto da qualsiasi PC dell'azienda
o solo da postazioni specifiche?
C'è un firewall che controlla chi può parlargli?
> *(→ `security_controls[]` per CTRL-NETISO)*

---

**D7. Gestione delle Eccezioni di Sicurezza**
Ci sono situazioni in cui avete dovuto "abbassare" un controllo di sicurezza
per far funzionare il sistema? (es. disabilitare il firewall, aprire porte, usare account condivisi)
Se sì: è documentato? C'è una scadenza?
> *(→ `security_controls[].exception` per ogni controllo con eccezione attiva)*

---

## BLOCCO E — Resilienza Operativa
*Obiettivo: capire cosa fate concretamente se il sistema cade.*

---

**E1.** Se questo sistema si bloccasse adesso, cosa farebbero gli operatori?
Hanno un modo per continuare a lavorare (foglio Excel, carta, sistema alternativo)?
Per quanto tempo reggerebbe questo workaround?
> *(→ `security_controls[].failure_management.business_workaround` per ogni controllo)*

---

**E2.** Per ogni workaround descritto sopra: esistono altri sistemi che devono funzionare
per poterlo eseguire? (es. "usiamo Excel ma serve la VPN", "chiamiamo il fornitore ma serve il telefono VoIP")
> *(→ `failure_management.workaround_dependencies`)*

---

**E3.** Esiste un documento scritto (procedura, playbook) che descrive passo-passo
cosa fare in caso di blocco di questo sistema?
Se sì, dove si trova? Chi sa dove trovarlo?
> *(→ `failure_management.incident_playbook_ref`)*

---

**E4.** Scenario specifico — Ransomware:
Se un ransomware cifrasse i dati di questo sistema questa notte,
qual è la sequenza di azioni che fareste stamattina?
Chi chiamereste per primo? Qual è il numero?
> *(→ valida la solidità di `failure_management` per tutti i controlli critici)*

---

**E5.** Nel caso peggiore — sistema completamente irrecuperabile —
quanto tempo ci vorrebbe per reinstallarlo da zero?
Avete i media di installazione? Le licenze? La documentazione di configurazione?
> *(→ affina `rto_hours` e `bcp_drill_result`)*

---

## BLOCCO F — Contesto OT/ICS (solo se il sistema interfaccia con produzione)
*Compilare solo se il gestionale si connette direttamente a macchine o PLC.*

---

**F1.** Questo sistema gira su hardware industriale (pannelli HMI, PC industriali, IPC)?
O su server IT standard?
> *(→ `ot_context.asset_type`)*

---

**F2.** Il software applicativo ha una versione specifica certificata dal fornitore?
Potete aggiornarlo liberamente o l'aggiornamento richiede validazione/downtime di produzione?
> *(→ `ot_context.firmware.patch_requires_downtime`, `.update_policy`)*

---

**F3.** Ci sono vulnerabilità note (CVE) sulla versione del software o del sistema operativo
che state usando e che non avete ancora risolto?
Se sì, c'è un controllo compensativo (es. firewall, isolamento di rete)?
> *(→ `ot_context.firmware.known_cves`, `.compensating_control_ref`)*

---

**F4.** Se questo sistema fosse compromesso, potrebbe causare danni fisici agli operatori
o alle attrezzature? (movimenti non controllati, sovratemperature, blocchi di sicurezza disattivati)
> *(→ `ot_context.safety_impact`)*

---

**F5.** La rete di produzione è fisicamente separata dalla rete uffici?
Da quando è stata verificata questa separazione l'ultima volta?
> *(→ `ot_context.air_gap_status`, `.air_gap_last_verified`)*

---

## BLOCCO G — Contesto per l'AI (Narrativa di Rischio)
*Obiettivo: raccogliere il "perché" narrativo che l'AI usa per generare analisi predittive.*
*Rispondete liberamente — più dettagli date, meglio l'AI capisce il sistema.*

---

**G1.** In una frase: perché questo sistema è vitale per l'azienda?
Cosa succede al business se non c'è?
> *(→ `reasoning_for_ai.logic_inference`)*

---

**G2.** Se questo sistema cadesse, quali altri sistemi o processi smetterebbero
di funzionare a cascata? In che ordine? (es. "prima si blocca X, poi Y non riceve più dati, poi Z non riesce a fatturare")
> *(→ `reasoning_for_ai.failure_cascading_effect`)*

---

**G3.** C'è qualcosa di specifico su questo sistema che chi ci lavora deve sapere
per usarlo in modo sicuro? Comportamenti rischiosi da evitare?
(es. "non aprire mai allegati email su questo PC", "non collegare USB", "non dare le credenziali al supporto esterno")
> *(→ `reasoning_for_ai.training_notes`)*

---

**G4.** Se doveste descrivere questo sistema a un nuovo collega con 3 parole chiave
che ne catturano l'essenza di rischio, quali sarebbero?
> *(→ `reasoning_for_ai.semantic_tags` — aiuto per il RAG clustering)*

---

## BLOCCO H — Verifica Finale e Gap Aperti

Al termine dell'intervista, l'intervistatore compila questa checklist:

| Campo BASM | Stato | Note |
|---|---|---|
| `identity_context` completo | ☐ | |
| `hourly_downtime_cost` > 0 | ☐ | |
| `rto_hours` / `rpo_hours` realistici e testati | ☐ | |
| `security_controls` ≥ 5 controlli mappati | ☐ | |
| Ogni controllo con `verification.source` | ☐ | |
| Ogni controllo con `failure_management.business_workaround` | ☐ | |
| `graph_edges` per ogni sistema collegato | ☐ | |
| `reasoning_for_ai` narrativo compilato | ☐ | |
| `ot_context` compilato o esplicitamente null | ☐ | |
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
| E — Resilienza | 20% | /20 |
| F — OT (se applicabile) | 5% | /5 |
| G — Narrativa AI | 5% | /5 |
| **TOTALE** | **100%** | **/100** |

---

*Template BASM v3.0-DIGITAL-TWIN — Interview Guide*
*Generato: 2026-03-08 | Per uso interno — classificazione: CONFIDENTIAL*
