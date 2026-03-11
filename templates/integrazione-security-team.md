# BASM — Scheda Integrazione Security Team (Crown Jewel)

> **Come usare questo documento**
> Questa scheda è compilata dal **team di sicurezza** *dopo* aver condotto l'intervista con il business owner (`intervista-business-owner.md`). Copre i campi tecnici che il business owner non può fornire: controlli implementati, staleness, firmware, CVE, topology di rete, threat model, economics dei controlli e quantificazione FAIR del rischio.
>
> Entrambe le schede compilate vengono poi passate a Claude con il prompt `prompt-intervista-to-basm.md` per generare il documento BASM v4.1 JSON.

---

## Riferimento Intervista

| Campo | Valore |
|---|---|
| App ID | `APP-ID: ___________________________` |
| Nome sistema (dall'intervista) | `___________________________` |
| Data compilazione scheda tecnica | `___________________________` |
| Analista / Security Engineer | `___________________________` |

---

## SEZIONE A — Asset fisico (Infrastructure Object)

**A.1 CMDB ID / Asset Tag (Qualys, ServiceNow, o altro CMDB)**

```
CMDB ID: ___________________________
Sistema CMDB: [ ] ServiceNow  [ ] Qualys VMDR  [ ] Altro: ___________
Qualys Asset ID: ___________________________
ServiceNow CMDB sys_id: ___________________________
```

**A.2 Il sistema è IT, OT, IoT, ICS, Cloud o Hybrid?**

```
[ ] IT (sistema informativo aziendale standard)
[ ] OT (Operational Technology — PLC, DCS, RTU)
[ ] ICS (Industrial Control System)
[ ] IoT (Internet of Things)
[ ] Cloud (hosted su provider cloud)
[ ] Hybrid
```

**A.3 (Solo OT/ICS) Livello Purdue ISA-95**

```
[ ] Livello 0 — Campo (sensori, attuatori fisici)
[ ] Livello 1 — Controllo (PLC, DCS)
[ ] Livello 2 — Supervisione (SCADA, HMI)
[ ] Livello 3 — Gestione operazioni (Historian, MES)
[ ] Livello 4 — Pianificazione aziendale (ERP, BI)
[ ] Livello 5 — Enterprise / DMZ
[ ] Non applicabile
```

**A.4 (Solo OT/ICS) Stato air gap**

```
[ ] Full air-gap (nessuna connessione esterna)
[ ] Partial air-gap (bridge OT/IT attivo, specificare scadenza): ___________________________
[ ] Connesso (nessun air-gap)

Protocolli OT consentiti (es. S7, Profinet, OPC-UA, Modbus, DNP3):
___________________________

Safety impact: [ ] none  [ ] low  [ ] medium  [ ] high  [ ] catastrophic
IEC 62443 Security Level target: [ ] SL-1  [ ] SL-2  [ ] SL-3  [ ] SL-4
```

**A.5 (Solo OT/ICS) Firmware**

```
Vendor: ___________________________
Modello hardware: ___________________________
Versione firmware corrente: ___________________________
Data ultimo patch: ___________________________
Il patch richiede downtime: [ ] Sì  [ ] No
CVE note sul firmware corrente (lista CVE ID): ___________________________
Qualys QID correlati: ___________________________
```

**A.6 Plant Site (multi-sito)**

```
Site code (es. ACMEFAB-MIL-01): ___________________________
Paese (ISO 3166-1 alpha-2, es. IT, DE, FR): ___________________________
Città: ___________________________
Plant Manager (nome): ___________________________
Linee di produzione afferenti (es. LINEA-A, LINEA-B): ___________________________
Giurisdizioni normative (es. NIS2-IT, GDPR, IEC62443):
___________________________
```

---

## SEZIONE B — Controlli di Sicurezza Implementati

> Compila una riga per ogni controllo di sicurezza rilevante. Aggiungi righe secondo necessità.
> Control ID format suggerito: `CTRL-{APP-ID}-{NOME}` (es. `CTRL-PLC001-EDR`)

**Controllo 1**

```
Control ID: ___________________________
Nome descrittivo: ___________________________
Tipo controllo: [ ] Preventive  [ ] Detective  [ ] Corrective  [ ] Deterrent  [ ] Compensating

Status attuale:
  Indicatore: [ ] green (efficace)  [ ] yellow (parzialmente efficace)  [ ] red (fallito/assente)  [ ] gray (sconosciuto)
  Confidence score (0.0–1.0): ___
  Descrizione stato: ___________________________

Verifica:
  Metodo: [ ] Automated  [ ] Manual  [ ] Hybrid
  Fonte dati (es. "Microsoft Defender for IoT API"): ___________________________
  Ultimo verificato (ISO-8601): ___________________________
  TTL giorni (dopo quanti giorni diventa stale): ___
  Staleness status: [ ] fresh  [ ] stale  [ ] expired  [ ] unknown
```

**Controllo 2**

```
Control ID: ___________________________
Nome descrittivo: ___________________________
Tipo controllo: [ ] Preventive  [ ] Detective  [ ] Corrective  [ ] Deterrent  [ ] Compensating

Status attuale:
  Indicatore: [ ] green  [ ] yellow  [ ] red  [ ] gray
  Confidence score (0.0–1.0): ___
  Descrizione stato: ___________________________

Verifica:
  Metodo: [ ] Automated  [ ] Manual  [ ] Hybrid
  Fonte dati: ___________________________
  Ultimo verificato (ISO-8601): ___________________________
  TTL giorni: ___
  Staleness status: [ ] fresh  [ ] stale  [ ] expired  [ ] unknown
```

**Controllo 3**

```
Control ID: ___________________________
Nome descrittivo: ___________________________
Tipo controllo: [ ] Preventive  [ ] Detective  [ ] Corrective  [ ] Deterrent  [ ] Compensating

Status attuale:
  Indicatore: [ ] green  [ ] yellow  [ ] red  [ ] gray
  Confidence score (0.0–1.0): ___
  Descrizione stato: ___________________________

Verifica:
  Metodo: [ ] Automated  [ ] Manual  [ ] Hybrid
  Fonte dati: ___________________________
  Ultimo verificato (ISO-8601): ___________________________
  TTL giorni: ___
  Staleness status: [ ] fresh  [ ] stale  [ ] expired  [ ] unknown
```

> *(Aggiungi ulteriori blocchi "Controllo N" secondo necessità)*

---

## SEZIONE C — Mapping Normativo per Controllo

> Per ogni Control ID definito in Sezione B, compila il mapping ai framework normativi.

| Control ID | ISO 27001 | NIS2 Art. | IEC 62443 SR | MITRE ATT&CK Tecnica | Policy interna ref |
|---|---|---|---|---|---|
| ___________ | A._____ | Art. _____ | SR _____ | T____ | POL-______ |
| ___________ | A._____ | Art. _____ | SR _____ | T____ | POL-______ |
| ___________ | A._____ | Art. _____ | SR _____ | T____ | POL-______ |

**Firewall rule references (per controlli network-related):**

| Control ID | Firewall / Appliance | Rule ID / Policy name |
|---|---|---|
| ___________ | ___________________ | ___________________ |
| ___________ | ___________________ | ___________________ |

---

## SEZIONE D — Eccezioni Attive (Risk Acceptance)

> Un'eccezione è un controllo temporaneamente disattivato o non pienamente efficace, con formale risk acceptance.

**Eccezione 1**

```
Control ID a cui si riferisce: ___________________________
Eccezione attiva: [ ] Sì  [ ] No
Motivo dell'eccezione: ___________________________
Approvata da (CISO o delegato): ___________________________
Data di approvazione (ISO-8601): ___________________________
Data di scadenza (ISO-8601): ___________________________
Risk Acceptance Form ref (es. RAF-2026-003): ___________________________
```

**Eccezione 2**

```
Control ID a cui si riferisce: ___________________________
Eccezione attiva: [ ] Sì  [ ] No
Motivo: ___________________________
Approvata da: ___________________________
Data scadenza (ISO-8601): ___________________________
RAF ref: ___________________________
```

---

## SEZIONE E — Economics dei Controlli

> Per ogni controllo, stima i costi annuali e il beneficio atteso in riduzione del rischio.

| Control ID | Tipo costo | CAPEX annuo (EUR) | OPEX annuo (EUR) | Riduzione rischio attesa (%) | ROI payback (anni) | Giorni implementazione |
|---|---|---|---|---|---|---|
| ___________ | [ ] Preventive [ ] Detective | ___________ | ___________ | ___________ | ___________ | ___________ |
| ___________ | [ ] Preventive [ ] Detective | ___________ | ___________ | ___________ | ___________ | ___________ |
| ___________ | [ ] Preventive [ ] Detective | ___________ | ___________ | ___________ | ___________ | ___________ |

---

## SEZIONE F — Connessioni di Rete (Graph Edges)

> Elenca tutte le connessioni rilevanti verso / da questo asset. Una riga per ogni connessione.

| Asset sorgente (ID o nome) | Asset destinazione (ID o nome) | Tipo relazione | Protocollo | Porta | Cifrato? | Mutual auth? | Attraversa segmenti? | Note |
|---|---|---|---|---|---|---|---|---|
| ___________ | ___________ | controlled-by / feeds-data-to / depends-on / altro: ___ | ___________ | ___________ | [ ] Sì [ ] No | [ ] Sì [ ] No | [ ] Sì [ ] No | ___________ |
| ___________ | ___________ | ___________ | ___________ | ___________ | [ ] Sì [ ] No | [ ] Sì [ ] No | [ ] Sì [ ] No | ___________ |
| ___________ | ___________ | ___________ | ___________ | ___________ | [ ] Sì [ ] No | [ ] Sì [ ] No | [ ] Sì [ ] No | ___________ |

**Tipi di relazione BASM disponibili:**
`controlled-by`, `feeds-data-to`, `depends-on`, `monitored-by`, `authenticates-via`, `stores-data-in`, `replicates-to`, `backup-of`, `serves`, `runs-on`

---

## SEZIONE G — Threat Model

**G.1 Attori di minaccia rilevanti**

| Actor ID (es. threat-actor--ransomware-ot) | Nome / Categoria | Sofisticazione | Likelihood targeting (0.0–1.0) | TTP MITRE noti |
|---|---|---|---|---|
| ___________ | ___________ | [ ] novice [ ] intermediate [ ] advanced [ ] expert | ___________ | T____, T____ |
| ___________ | ___________ | [ ] novice [ ] intermediate [ ] advanced [ ] expert | ___________ | T____, T____ |

**G.2 Scenari di attacco / Tecniche MITRE ATT&CK**

| MITRE ID | Nome tecnica | Tattica MITRE | Probabilità successo (0.0–1.0) | Impatto stimato (EUR) | Controlli mitiganti (Control ID) |
|---|---|---|---|---|---|
| T______ | ___________ | ___________ | ___________ | ___________ | ___________ |
| T______ | ___________ | ___________ | ___________ | ___________ | ___________ |

**G.3 Tattiche MITRE ATT&CK NON coperte dai controlli attuali (coverage gap)**

```
Tattiche / Tecniche scoperte:
___________________________
```

---

## SEZIONE H — Knowledge Collections (KC Hooks)

> Riferimenti ai sistemi esterni che alimentano o correggono i dati di questo bundle BASM.

```
Policy documents (es. POL-CISO-OT-2025-001):
___________________________

Qualys VMDR:
  Asset ID: ___________________________
  N. vulnerabilità critiche aperte: ___
  N. vulnerabilità high aperte: ___

ServiceNow CMDB:
  CMDB sys_id: ___________________________
  N. ticket aperti correlati: ___

Firewall / Network policies:
  Appliance / Firewall name: ___________________________
  Rule group / Policy ID: ___________________________

Altro (SIEM, EDR, PAM, IAM):
___________________________
```

---

## SEZIONE I — Quantificazione del Rischio FAIR-Core

> Il modello FAIR (Factor Analysis of Information Risk) quantifica il rischio in EUR/anno. I valori sono stime — indicare sempre la confidence nell'ultima riga.

```
Threat Event Frequency (TEF) — quante volte all'anno si stima che un attore
tenti di compromettere questo asset:
  TEF (eventi/anno, es. 0.4): ___

Vulnerability Probability — se l'attore tenta, qual è la probabilità che
riesca a compromettere l'asset (0.0–1.0):
  Vulnerability Probability: ___

Primary Loss Magnitude — perdita attesa per singolo evento riuscito (EUR):
  PLM (EUR): ___________________________
  (suggerimento: usa il valore di "impatto stimato" dello scenario peggiore
  dalla Sezione G.2 o da S3.1 dell'intervista business owner × fattore durata)

Risk Score Annualized (calcolato: TEF × Vulnerability × PLM):
  ALE (EUR/anno): ___________________________ [calcolato automaticamente da Claude]

Confidence nella stima (0.0–1.0):
  Confidence: ___

Revisore (nome, ruolo):
  ___________________________

Data valutazione (ISO-8601):
  ___________________________
```

---

## SEZIONE L — Maturity Scoring

> Stima di partenza per il composite score BASM. Verrà aggiornato da Claude.

```
Data completeness (0.0–1.0) — quanto sono completi i dati di questo bundle:
  ___

Automation ratio (0.0–1.0) — quanti controlli sono verificati automaticamente
  vs. manualmente:
  ___

Compliance index (0.0–1.0) — percentuale di controlli con mapping normativo
  completo:
  ___

Maturity phase:
  [ ] Initial (0.0–0.2)
  [ ] Developing (0.2–0.4)
  [ ] Defined (0.4–0.6)
  [ ] Managed (0.6–0.8)
  [ ] Optimizing (0.8–1.0)

Peer group (es. "Manufacturing OT — Purdue L1-L2 (EU)"):
  ___________________________

Industry benchmark median (0.0–1.0, se noto):
  ___

Industry benchmark top quartile (0.0–1.0, se noto):
  ___
```

---

## Note tecniche finali

```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

> **Passo successivo**
> Copia il testo completo di `intervista-business-owner.md` (compilata) e di questa scheda, quindi usa il prompt in `prompt-intervista-to-basm.md` su Claude per generare il documento BASM v4.1 JSON. Valida l'output con: `ajv validate -s schema/basm.schema.v4.json -d sample/basm-{app-id}.v4.json`
