# Intervista BASM — SCADA / Sistema di Controllo Industriale (ICS/OT)
**Template di intervista strutturata per compilare il BASM v3.0 a 100/100**

---

> **Come usare questo documento**
> Ogni domanda riporta tra parentesi il campo JSON che popola.
> Rispondi liberamente — non servono risposte tecniche precise.
> L'intervistatore traduce le tue risposte nei valori corretti.
> Tempo stimato: 60–75 minuti (più lungo per la componente OT/safety).
> **Referente ideale:** Responsabile Automazione, Ingegnere di Processo, Responsabile Manutenzione,
> OT Security Manager, Plant Manager.
>
> ⚠️ **Nota speciale:** I sistemi SCADA/ICS operano in ambienti dove un incidente di sicurezza
> può causare danni fisici a persone, attrezzature e ambiente.
> La sicurezza informatica (cybersecurity) e la sicurezza funzionale (safety) sono interdipendenti.

---

## BLOCCO A — Identità e Responsabilità
*Obiettivo: capire chi possiede il sistema e perché esiste.*

---

**A1.** Come si chiama ufficialmente il sistema SCADA/HMI che gestiamo oggi?
Fornitore e versione? (es. Siemens WinCC 7.5, AVEVA System Platform 2023, Ignition 8.1, GE iFIX)
> *(→ `identity_context.name`, `ot_context.firmware.current_version`)*

---

**A2.** Chi è il responsabile di business di questo sistema?
Se la linea di produzione si ferma alle 14:00, chi riceve la chiamata dal Plant Manager?
> *(→ `identity_context.business_owner.name`, `.department`, `.contact`)*

---

**A3.** Chi è il responsabile tecnico (Automation Engineer, SCADA Admin)?
È un team interno o il fornitore/system integrator?
> *(→ `identity_context.technical_lead`)*

---

**A4.** Classificazione criticità:

- 🔴 **Tier-1 Gold** — Controlla direttamente la produzione; se si ferma, si ferma la fabbrica
- 🟡 **Tier-2 Silver** — Monitoraggio; gli operatori possono agire manualmente per alcune ore
- 🟢 **Tier-3 Bronze** — Solo visualizzazione storica; la produzione continua senza di esso

> *(→ `identity_context.criticality_class`)*

---

## BLOCCO B — Impatto sul Business
*Obiettivo: quantificare il costo di un'interruzione o manipolazione dello SCADA.*

---

**B1.** Quale processo produttivo controlla questo sistema SCADA?
(es. "gestisce il sorter automatico della linea X", "controlla temperatura e pressione del reparto Y",
"gestisce il riempimento automatico dei serbatoi Z")
> *(→ `business_impact_analysis.process_chain`)*

---

**B2.** Se lo SCADA fosse completamente inaccessibile per 1 ora:
- La produzione si ferma completamente o gli operatori possono gestirla manualmente?
- A quale capacità produttiva (%) si lavora in modalità manuale?
- Qual è il costo di produzione persa per ora?
- Ci sono materie prime o processi che si deteriorano se il controllo automatico si interrompe?
  (es. reazioni chimiche non controllate, prodotti che si raffreddano, linee di confezionamento bloccate)

Stima euro/ora:
> *(→ `business_impact_analysis.hourly_downtime_cost`,
>   `ot_context.degraded_mode_max_minutes`, `ot_context.degraded_mode_throughput_ratio`)*

---

**B3.** Scenario peggiore — manipolazione dei dati (attaccante modifica setpoint):
Cosa potrebbe fare un attaccante che prendesse il controllo dello SCADA?
- Danni fisici alle attrezzature?
- Rischi per la sicurezza degli operatori?
- Prodotti non conformi che escono dalla linea?
- Danni ambientali?
> *(→ `ot_context.safety_impact`, nota per `reasoning_for_ai`)*

---

**B4.** Avete una polizza cyber che coprirebbe un incidente SCADA?
Specifica per rischi OT o solo IT?
> *(→ `business_impact_analysis.cyber_insurance_coverage`)*

---

**B5.** Obblighi normativi per questo sistema:
- NIS2: siete un'entità Essential o Important nel settore manifatturiero?
- IEC 62443: avete una valutazione del Security Level (SL) target?
- Normative di sicurezza funzionale: IEC 61511 (processi), IEC 62061 (macchinari), EN ISO 13849?
- Requisiti del cliente: audit di sicurezza OT richiesti contrattualmente?
> *(→ `business_impact_analysis.legal_implications`, `ot_context.iec62443_target_sl`)*

---

**B6.** RTO e RPO:
- Entro quante ore dovete ripristinare lo SCADA per non compromettere la produzione?
- Quanti minuti di dati storici (trend, allarmi, eventi) potete perdere?
> *(→ `recovery_objectives.rto_hours`, `.rpo_hours`)*

---

**B7.** Avete mai simulato un disaster recovery dello SCADA?
Il fornitore ha partecipato? Quanto ha richiesto?
> *(→ `recovery_objectives.last_bcp_drill`, `.bcp_drill_result`)*

---

**B8.** Soglia di allerta al management:
> *(→ `business_impact_analysis.board_notification_threshold`)*

---

## BLOCCO C — Architettura e Contesto Tecnologico
*Obiettivo: capire dove vive lo SCADA e come si connette al resto (IT e OT).*

---

**C1.** Dove gira il server SCADA?
- PC industriale dedicato (IPC) in campo?
- Server rack in sala controllo?
- Macchina virtuale in datacenter?
- Architettura distribuita (server centrale + stazioni HMI remote)?
> *(→ `ot_context.asset_type` — OT | ICS | Hybrid)*

---

**C2.** Livello Purdue di questo sistema:
- **Livello 1** — PLC/RTU (controllo diretto macchinari)
- **Livello 2** — HMI/SCADA (supervisione processo, stesso piano del PLC)
- **Livello 3** — MES/Historian (aggregazione dati produzione, DMZ OT)
- **Livello 3.5** — DMZ OT/IT (zona di demarcazione)

Il sistema che stiamo intervistando a che livello si trova?
> *(→ `ot_context.purdue_level`)*

---

**C3.** Separazione rete OT/IT:
- La rete OT (PLC, HMI, SCADA) è fisicamente separata dalla rete IT uffici?
- C'è un firewall o data diode tra OT e IT?
- L'ultima verifica di questa separazione quando è stata effettuata?
- Esistono percorsi di rete non documentati che attraversano il confine OT/IT?
  (es. PC di manutenzione, laptop di tecnici, router 4G di backup)
> *(→ `ot_context.air_gap_status`, `.air_gap_last_verified`)*

---

**C4.** Con quali sistemi comunica lo SCADA?
Per ognuno: protocollo, direzione, cosa succede se la comunicazione si interrompe.

| Sistema | Livello Purdue | Protocollo | Direzione |
|---|---|---|---|
| PLC/RTU di campo | L1 | OPC-DA/UA, Profinet, Modbus, S7, DNP3 | ↑ |
| Historian (AVEVA PI, OSIsoft, ecc.) | L3 | OPC-UA, ODBC | ↑ |
| MES / Gestionale produzione | L3 | OPC-UA, REST, database | ↑↓ |
| Engineering Workstation | L2/L3 | Proprietario fornitore | ↓ |
| Active Directory (se usato) | L4 | LDAP/Kerberos | → |
| Jump Server / Remote Access | DMZ | RDP, VNC, proprietario | → |
| Sistema allarmi / PAGA | L2 | ? | ↑ |

> *(→ `graph_edges[]`, `ot_context.allowed_protocols`)*

---

**C5.** Esistono connessioni verso l'esterno (vendor remoto, cloud)?
- Il fornitore SCADA ha accesso remoto per supporto? Come?
  (VPN dedicata? Porta sempre aperta? Solo su richiesta con jump server?)
- I dati di produzione vengono inviati al cloud del fornitore o a cloud aziendali?
> *(→ `graph_edges[]` tipo ACCESSED_VIA, SENDS_DATA_TO)*

---

**C6.** Per ogni connessione: cosa succederebbe se fosse tagliata durante un attacco?
> *(→ `graph_edges[].severance_impact`)*

---

**C7.** Le comunicazioni sono cifrate?
(OPC-UA supporta sicurezza a livello di messaggio; Modbus/Profinet classici no)
> *(→ `graph_edges[].encrypted`, `.mutually_authenticated`)*

---

## BLOCCO D — Controlli di Sicurezza Attivi
*Obiettivo: valutare le protezioni specifiche per ambienti OT.*

---

**D1. Application Whitelisting / EDR per OT**
Sui server SCADA/HMI c'è un sistema di controllo applicazioni?
(es. Claroty, Nozomi, Dragos, TXOne, Microsoft Defender for IoT)
- L'antivirus standard IT è compatibile con questo SCADA? Il fornitore lo consente?
- Chi riceve gli alert di sicurezza OT?

> *(→ `security_controls[]` CTRL-SCADA-WHITELISTING)*

**Nota:** In ambienti OT è spesso preferibile l'Application Whitelisting rispetto all'EDR tradizionale,
per evitare falsi positivi che bloccherebbero il controllo di processo.

---

**D2. Autenticazione e Accessi**
- Per accedere all'HMI/SCADA serve autenticazione individuale o c'è un account condiviso?
  (es. "operatore1" usato da tutti gli operatori del turno → rischio traceability)
- Chi ha accesso alle funzioni di configurazione (engineering mode)?
- I manutentori del fornitore come accedono? Via jump server tracciato o direttamente?
- Esiste un account di emergenza locale (break-glass) per operare in caso di problemi di rete?
> *(→ `security_controls[]` CTRL-SCADA-MFA)*

---

**D3. Backup della Configurazione SCADA**
- Il progetto SCADA (configurazione, logica di controllo, trend templates) viene backuppato?
- La backup include: configurazione PLC, logica ladder/FBD, setpoint, recipe?
- Il backup è su storage separato dalla rete OT?
- Avete mai verificato che il backup sia completo e ripristinabile?
> *(→ `security_controls[]` CTRL-SCADA-BACKUP)*

---

**D4. Patch e Aggiornamenti**
- Con quale frequenza aggiornate il software SCADA? Il fornitore certifica gli aggiornamenti?
- Il sistema operativo del server SCADA è ancora supportato? (molti SCADA girano su Windows 7/2008)
- L'applicazione di patch richiede un fermo produzione pianificato?
- Chi approva un aggiornamento in produzione (Automation + IT + Plant Manager insieme)?
> *(→ `security_controls[]` CTRL-SCADA-PATCH, `ot_context.firmware.patch_requires_downtime`)*

---

**D5. Log e Monitoraggio**
- Lo SCADA registra gli accessi degli operatori e le modifiche ai setpoint?
- I log vengono estratti e conservati fuori dalla rete OT?
- Esiste un sistema di monitoraggio del traffico OT (passive network monitoring)?
  (es. Claroty, Nozomi Networks, Dragos — analisi passiva senza rischio di interferire col processo)
- In caso di incidente, riuscireste a ricostruire chi ha modificato quale setpoint e quando?
> *(→ `security_controls[]` CTRL-SCADA-LOGGING)*

---

**D6. Segmentazione e Accesso Remoto**
- C'è un jump server o bastion host per l'accesso remoto alla rete OT?
- Gli accessi remoti del fornitore vengono registrati e revocati al termine della manutenzione?
- Esistono modem 4G/UMTS installati sui PLC per accesso diretto del fornitore?
  (spesso presenti senza la consapevolezza dell'IT — verificare!)
> *(→ `security_controls[]` CTRL-SCADA-NETISO)*

---

**D7. Gestione delle Eccezioni**
- Ci sono PC di manutenzione con accesso sia alla rete OT che alla rete IT uffici?
- Ci sono porte USB abilitate su PC industriali? Gli operatori collegano chiavette USB personali?
- Ci sono connessioni non documentate tra la rete OT e internet (es. per aggiornamenti meteo, orario NTP)?
> *(→ `security_controls[].exception`)*

---

## BLOCCO E — Resilienza Operativa
*Obiettivo: capire cosa fate se lo SCADA cade o viene compromesso.*

---

**E1.** Se lo SCADA fosse completamente inaccessibile, gli operatori potrebbero:
- Operare la linea in modalità manuale (pannelli locali, valvole manuali)?
- Per quanto tempo? Quali limitazioni operative?
- Quali processi non possono assolutamente essere gestiti manualmente (rischio safety)?
> *(→ `ot_context.degraded_mode_max_minutes`, `failure_management.business_workaround`)*

---

**E2.** Per la modalità manuale: quali altri sistemi devono funzionare?
(es. "gli operatori leggono i valori dagli strumenti locali ma serve alimentazione ai trasduttori",
"la valvola di sicurezza si chiude automaticamente senza SCADA — verifica")
> *(→ `failure_management.workaround_dependencies`)*

---

**E3.** Esiste un playbook per:
- Blocco totale dello SCADA (server down)?
- Comportamento anomalo (setpoint modificati senza autorizzazione)?
- Accesso non autorizzato rilevato alla rete OT?
> *(→ `failure_management.incident_playbook_ref`)*

---

**E4.** Scenario Ransomware — SCADA cifrato questa notte:
1. Chi chiamerete per primo? (IT interno? Fornitore SCADA? Plant Manager?)
2. Riuscite a continuare la produzione in modalità manuale mentre ripristinate?
3. Quanto tempo richiede un ripristino completo del progetto SCADA da zero?
4. Il fornitore ha un contratto di supporto con SLA di ripristino?
> *(→ valida `rto_hours` e `failure_management`)*

---

**E5.** Ripristino da zero:
- Avete i media di installazione del software SCADA (offline, non solo download cloud)?
- Avete la licenza del software documentata e recuperabile?
- La documentazione del progetto (P&ID, logica di controllo) è aggiornata e accessibile offline?
> *(→ affina `bcp_drill_result`)*

---

## BLOCCO F — Contesto OT/ICS e Safety (OBBLIGATORIO per sistemi SCADA)
*Questo blocco è obbligatorio — non opzionale come nel template MES.*

---

**F1.** Hardware di campo:
- Quale PLC/RTU controlla questo processo? (es. Siemens S7-1500, Allen-Bradley ControlLogix, Schneider M340)
- Il firmware del PLC è alla versione più recente certificata dal fornitore?
- Esistono CVE noti sulla versione del PLC o del firmware SCADA attualmente in uso?
> *(→ `ot_context.firmware.current_version`, `.vendor`, `.known_cves`)*

---

**F2.** Impatto Safety — questo sistema influenza la sicurezza fisica?
- Ci sono Safety Instrumented Systems (SIS) separati dallo SCADA?
  (es. ESD — Emergency Shutdown System, F&G — Fire and Gas Detection)
- Lo SCADA può scavalcare o disabilitare le funzioni di sicurezza (Safety Override)?
- Qual è il Safety Integrity Level (SIL) del sistema?
- Un attacco informatico potrebbe disabilitare le protezioni fisiche di sicurezza?
> *(→ `ot_context.safety_impact`, `ot_context.iec62443_target_sl`)*

---

**F3.** Vulnerabilità note e CVE OT:
- Avete ricevuto security advisory dal fornitore SCADA/PLC negli ultimi 12 mesi?
- Ci sono vulnerabilità note che non avete ancora risolto?
  Se sì: qual è il controllo compensativo (es. isolamento di rete, monitoraggio attivo)?
> *(→ `ot_context.firmware.known_cves`, `.compensating_control_ref`)*

---

**F4.** Ciclo di vita e obsolescenza:
- Quando va in End-of-Life il software SCADA attuale? E il PLC?
- Avete un piano di migrazione documentato?
- Esistono componenti già fuori supporto? (hardware non più disponibile sul mercato)
> *(→ `ot_context.firmware.update_policy` — spesso "vendor_driven" o "frozen")*

---

**F5.** Verifica separazione OT/IT:
- L'ultima verifica formale della separazione OT/IT quando è avvenuta?
- Chi l'ha eseguita? Con quali strumenti?
- I risultati sono documentati?
> *(→ `ot_context.air_gap_status`, `.air_gap_last_verified`)*

---

**F6.** Incidenti passati:
- Avete mai avuto incidenti di sicurezza sulla rete OT?
  (es. malware che si è propagato, accesso non autorizzato, anomalie nei dati di processo)
- Se sì: cosa è successo? Come avete risposto? Cosa avete cambiato dopo?
> *(→ nota per `reasoning_for_ai.training_notes`)*

---

## BLOCCO G — Contesto per l'AI (Narrativa di Rischio)
*Obiettivo: raccogliere il "perché" narrativo per le analisi AI.*

---

**G1.** In una frase: perché questo sistema SCADA è critico per l'azienda?
Cosa succederebbe alla produzione e alla sicurezza degli operatori se non ci fosse?
> *(→ `reasoning_for_ai.logic_inference`)*

---

**G2.** Se lo SCADA venisse compromesso (attaccante modifica setpoint o blocca il sistema),
descrivete l'effetto a cascata — produttivo, economico, di sicurezza fisica:
> *(→ `reasoning_for_ai.failure_cascading_effect`)*

---

**G3.** Comportamenti rischiosi da evitare:
(es. "non collegare chiavette USB ai PC OT", "non connettersi alla rete uffici dalla workstation di ingegneria",
"non permettere accesso remoto del fornitore senza supervisione interna")
> *(→ `reasoning_for_ai.training_notes`)*

---

**G4.** 3–5 parole chiave che catturano l'essenza di rischio di questo sistema:
> *(→ `reasoning_for_ai.semantic_tags`)*

---

## BLOCCO H — Verifica Finale e Gap Aperti

| Campo BASM | Stato | Note |
|---|---|---|
| `identity_context` completo con fornitore e versione | ☐ | |
| `hourly_downtime_cost` > 0 con stima produzione persa | ☐ | |
| `ot_context.safety_impact` compilato (anche se "none") | ☐ | |
| `ot_context.purdue_level` corretto (tipicamente L2) | ☐ | |
| `ot_context.air_gap_status` verificato e datato | ☐ | |
| Firmware PLC/SCADA e CVE noti documentati | ☐ | |
| `security_controls` ≥ 6 con soluzioni OT-appropriate | ☐ | |
| Modem 4G/accessi remoti vendor censiti | ☐ | |
| `graph_edges` per PLC, Historian, MES, jump server | ☐ | |
| SIS/safety system separazione verificata | ☐ | |
| Playbook modalità manuale + ransomware referenziato | ☐ | |
| `reasoning_for_ai` con impatto safety compilato | ☐ | |

---

**Punteggio BASM stimato post-intervista:**

| Blocco | Peso | Score stimato |
|---|---|---|
| A — Identità | 10% | /10 |
| B — Business Impact | 15% | /15 |
| C — Architettura OT | 15% | /15 |
| D — Controlli OT | 20% | /20 |
| E — Resilienza | 15% | /15 |
| F — OT/Safety (OBBLIGATORIO) | 20% | /20 |
| G — Narrativa AI | 5% | /5 |
| **TOTALE** | **100%** | **/100** |

---

*Template BASM v3.0-DIGITAL-TWIN — Interview Guide SCADA/ICS*
*Generato: 2026-03-08 | Per uso interno — classificazione: CONFIDENTIAL*
