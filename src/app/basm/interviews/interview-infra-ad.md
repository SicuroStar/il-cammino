# Intervista BASM — Active Directory / Identity & Access Management (IAM)
**Template di intervista strutturata per compilare il BASM v3.0 a 100/100**

---

> **Come usare questo documento**
> Ogni domanda riporta tra parentesi il campo JSON che popola.
> Rispondi liberamente — non servono risposte tecniche precise.
> L'intervistatore traduce le tue risposte nei valori corretti.
> Tempo stimato: 45–60 minuti.
> **Referente ideale:** Responsabile IT Infrastructure, System Administrator, CISO.
>
> ⚠️ **Nota speciale:** Active Directory è il sistema più critico in assoluto.
> Chi lo controlla, controlla l'identità di ogni utente, ogni server, ogni applicazione aziendale.
> Un attaccante che compromette AD ha compromesso tutto il resto.

---

## BLOCCO A — Identità e Responsabilità
*Obiettivo: capire chi possiede il sistema e perché esiste.*

---

**A1.** Come si chiama il dominio Active Directory principale?
Esistono più foreste (forest) o domini (domain) separati?
(es. azienda.local, azienda.com, child.azienda.com)
> *(→ `identity_context.name`, nota su topologia forest/domain)*

---

**A2.** Chi è il responsabile di business di questa infrastruttura?
Se tutti gli utenti perdessero l'accesso ai propri PC alle 9:00 di mattina, chi riceve la chiamata dal CEO?
> *(→ `identity_context.business_owner.name`, `.department`, `.contact`)*

---

**A3.** Chi è il responsabile tecnico (Domain Admin, Sys Admin)?
È un team interno o ci si affida a un managed service provider?
> *(→ `identity_context.technical_lead`)*

---

**A4.** Classificazione criticità:

- 🔴 **Tier-1 Gold** — Senza AD nessun utente si autentica, nessuna applicazione funziona
- 🟡 **Tier-2 Silver** — Ci sono sistemi locali che possono funzionare offline per qualche ora
- 🟢 **Tier-3 Bronze** — (non applicabile: AD è sempre Tier-1 Gold)

> *(→ `identity_context.criticality_class` — quasi sempre Tier-1-Gold)*

---

## BLOCCO B — Impatto sul Business
*Obiettivo: quantificare l'impatto di un'interruzione o compromissione di AD.*

---

**B1.** Quante applicazioni aziendali si autenticano tramite Active Directory?
(Es. ERP, email, VPN, file server, MES, CRM, portale web interno)
Queste applicazioni smetterebbero di funzionare se AD non fosse raggiungibile?
> *(→ `business_impact_analysis.process_chain` — AD abilita TUTTO)*

---

**B2.** Se AD fosse completamente irraggiungibile per 1 ora:
- Quanti dipendenti non possono accedere al PC? × costo orario medio
- Quante applicazioni critiche si bloccherebbero?
- Ci sono sistemi OT/produzione che dipendono da AD per l'autenticazione degli operatori?

Stima euro/ora:
> *(→ `business_impact_analysis.hourly_downtime_cost`)*

---

**B3.** Scenario peggiore — compromissione completa (attaccante diventa Domain Admin):
Cosa potrebbe fare un attaccante con il controllo totale di AD?
- Leggere/cifrare tutti i dati aziendali?
- Disabilitare tutti gli account utente?
- Impersonare qualsiasi utente per accedere a ERP, email, banca?
> *(→ nota per `reasoning_for_ai.failure_cascading_effect`)*

---

**B4.** Avete una polizza cyber che coprirebbe un incidente AD (es. Golden Ticket attack)?
> *(→ `business_impact_analysis.cyber_insurance_coverage`)*

---

**B5.** Obblighi normativi legati all'identità:
- GDPR: AD gestisce accesso a dati personali — avete un registro degli accessi ai dati?
- NIS2: la gestione dell'identità è esplicitamente richiesta all'Art. 21.2(i)
- ISO 27001: A.9 — Access Control è un controllo obbligatorio
> *(→ `business_impact_analysis.legal_implications`)*

---

**B6.** RTO e RPO:
- Entro quanto tempo dovete ripristinare AD per non paralizzare l'azienda?
- Quante ore di modifiche (utenti creati, password cambiate, GPO modificati) potete perdere?
> *(→ `recovery_objectives.rto_hours`, `.rpo_hours`)*

---

**B7.** Avete mai simulato un disaster recovery di AD (ripristino controller di dominio da backup)?
> *(→ `recovery_objectives.last_bcp_drill`, `.bcp_drill_result`)*

---

**B8.** Soglia di allerta al management:
> *(→ `business_impact_analysis.board_notification_threshold`)*

---

## BLOCCO C — Architettura e Topologia
*Obiettivo: capire come è strutturato AD e dove sono i Domain Controller.*

---

**C1.** Quanti Domain Controller (DC) avete in totale?
Dove sono fisicamente collocati? (es. sede principale, sedi remote, datacenter cloud)
> *(→ `ot_context.asset_type` — IT | Hybrid)*

---

**C2.** Esiste un Read-Only Domain Controller (RODC) in sedi remote?
O tutte le sedi remote dipendono da un DC centrale via WAN?
> *(→ nota architetturale per `graph_node`, `ot_context`)*

---

**C3.** Avete un Azure Active Directory (Entra ID) o altri IdP cloud collegati?
Tipo di join: Azure AD Join, Hybrid Join, AD Connect (sync)?
> *(→ `graph_edges[]` tipo SYNCS_WITH — AD locale → Azure AD)*

---

**C4.** Con quali sistemi si autentica tramite AD?
Per ognuno: protocollo, criticità, cosa succede se la comunicazione si interrompe.

| Sistema | Protocollo | Criticità |
|---|---|---|
| PC/laptop utenti | Kerberos / NTLM | Critical |
| File server / NAS | SMB + Kerberos | High |
| ERP / SAP | LDAP / SAML / Kerberos | Critical |
| VPN | RADIUS + AD | High |
| Email (Exchange / M365) | LDAP / OAuth / AD Connect | High |
| MES / SCADA (se applicabile) | LDAP / Kerberos | Critical |
| Applicazioni web interne | LDAP / SAML / OAuth | Medium/High |

> *(→ `graph_edges[]`: type=AUTHENTICATES_VIA, direction=Inbound verso AD)*

---

**C5.** Esiste un trust tra domini o forest diverse?
(es. trust con società acquisite, trust con partner, trust con ambienti legacy)
I trust sono tutti necessari o ci sono trust obsoleti?
> *(→ `graph_edges[]` tipo TRUSTS, nota su trust obsoleti)*

---

**C6.** Le comunicazioni tra DC e client sono cifrate?
(LDAP vs LDAPS, Kerberos è cifrato per design, SMB signing attivo?)
> *(→ `graph_edges[].encrypted`, `.mutually_authenticated`)*

---

## BLOCCO D — Controlli di Sicurezza Attivi
*Obiettivo: valutare la postura di sicurezza dell'identità aziendale.*

---

**D1. EDR sui Domain Controller**
I Domain Controller hanno un EDR o antivirus?
Attenzione: i DC sono server critici — alcuni vendor richiedono esclusioni specifiche.
Chi controlla gli alert del DC?
> *(→ `security_controls[]` CTRL-AD-EDR)*

---

**D2. Privileged Access Management (PAM) — Account Privilegiati**
- Quanti account hanno diritti di Domain Admin?
  (Risposta ideale: ≤5, dedicati, mai usati per la navigazione quotidiana)
- Esistono account di servizio con privilegi eccessivi?
- Avete un sistema PAM (CyberArk, BeyondTrust, Delinea)?
  Se sì: le password degli account privilegiati ruotano automaticamente?
- I Domain Admin usano workstation dedicate (PAW — Privileged Access Workstation)?
  O accedono ai DC dal proprio PC di lavoro normale?

> *(→ `security_controls[]` CTRL-AD-PAM)*

**Domande di approfondimento:**
- Qualcuno usa la stessa password per account admin e account normale?
- C'è un account "Administrator" domain-wide condiviso tra più persone?
- I DC sono accessibili via RDP da qualsiasi PC o solo da workstation dedicate?

---

**D3. Autenticazione Forte per Account Privilegiati**
- Gli account Domain Admin richiedono MFA per i login?
- Usate Smart Card o Windows Hello for Business per gli amministratori?
- Avete Privileged Identity Management (PIM) per i diritti temporanei?
> *(→ `security_controls[]` CTRL-AD-MFA)*

---

**D4. Backup di Active Directory**
- I Domain Controller vengono backuppati? Con quale frequenza?
- Il backup include il System State (NTDS.dit + SYSVOL)?
- I backup sono su storage offline o air-gapped (non raggiungibile via rete normale)?
- Avete mai eseguito un ripristino autorevole (authoritative restore) di un oggetto AD?
> *(→ `security_controls[]` CTRL-AD-BACKUP)*

---

**D5. Patch dei Domain Controller**
- Con quale frequenza vengono aggiornati i DC? (idealmente: Patch Tuesday + 15 giorni)
- Esiste una procedura per applicare patch critiche senza downtime (rolling reboot)?
- Ci sono DC con sistemi operativi fuori supporto? (Windows Server 2008/2012 — EOL)
> *(→ `security_controls[]` CTRL-AD-PATCH)*

---

**D6. Log e Monitoraggio AD**
- Il Windows Security Event Log (eventi 4624, 4625, 4648, 4672, 4771) è attivo e collezionato?
- I log dei DC vengono inviati a un SIEM centralizzato?
- Avete alerting su:
  - Creazione account privilegiati fuori orario?
  - Kerberoasting / AS-REP Roasting (richieste di ticket anomale)?
  - DCSync (replica non autorizzata del database AD)?
  - Modifiche a GPO critiche?
> *(→ `security_controls[]` CTRL-AD-LOGGING)*

---

**D7. Group Policy (GPO) e Hardening**
- Avete GPO che impongono:
  - Blocco USB sulle workstation?
  - Schermata di blocco automatica dopo X minuti?
  - Disabilitazione di NTLM (a favore di Kerberos)?
  - Password policy (lunghezza minima, complessità, no riuso)?
- Chi può modificare le GPO? Le modifiche sono tracciate?
> *(→ `security_controls[]` CTRL-AD-HARDENING)*

---

**D8. Gestione delle Eccezioni**
- Ci sono account con privilegi temporanei che sono "temporanei" da mesi?
- Ci sono account di ex-dipendenti ancora attivi?
- Ci sono service account con password che non scadono mai (Password Never Expires)?
> *(→ `security_controls[].exception`)*

---

## BLOCCO E — Resilienza Operativa
*Obiettivo: cosa fate se AD viene compromesso o reso inaccessibile.*

---

**E1.** Se AD fosse completamente irraggiungibile (tutti i DC down), cosa fareste?
- Avete un piano di emergenza per autenticare gli utenti critici?
- I sistemi più critici hanno account locali di emergenza (break-glass accounts)?
- Dove sono documentate le password di emergenza? Sono in un posto non raggiungibile via AD?
> *(→ `failure_management.business_workaround`)*

---

**E2.** Se AD fosse *compromesso* (attaccante ha credenziali Domain Admin), cosa fareste?
- Sequenza di azioni immediate (isolare i DC? Bloccare tutto? Chiamare chi?)
- Avete un piano per identificare quali account/sistemi sono stati compromessi?
- Come ripristinate la fiducia nel dominio dopo una compromissione totale?
> *(→ `failure_management.immediate_action` per CTRL-AD-PAM)*

---

**E3.** Esiste un playbook documentato per:
- Ripristino DC da backup?
- Risposta a Golden Ticket attack?
- Risposta a DCSync / pass-the-hash attack?
> *(→ `failure_management.incident_playbook_ref`)*

---

**E4.** Scenario Golden Ticket — attaccante ha compromesso il KRBTGT account:
1. Come rilevate la compromissione?
2. Sapete che per invalidare un Golden Ticket dovete resettare KRBTGT *due volte* con 10 ore di intervallo?
3. Avete documentato questa procedura?
> *(→ valida la maturità di risposta agli incidenti AD)*

---

**E5.** Ripristino da zero (Forest Recovery):
- Avete documentazione per un full forest recovery?
- Avete testato il ripristino di un DC da backup System State?
- Quanto tempo richiederebbe un full rebuild del dominio?
> *(→ affina `rto_hours` e `bcp_drill_result`)*

---

## BLOCCO F — Infrastruttura Critica e Hardening Avanzato
*Obiettivo: valutare il livello di hardening specifico per AD.*

---

**F1.** Tier Model (Admin Tiering):
Avete implementato o pianificato il modello a 3 livelli:
- Tier 0: Domain Controller, CA (Certificate Authority), PAM vault
- Tier 1: Server applicativi, database
- Tier 2: Workstation utenti
Gli admin di Tier 0 non devono autenticarsi mai da sistemi Tier 1 o Tier 2?
> *(→ `security_controls[]` CTRL-AD-TIERING)*

---

**F2.** Certificate Authority (PKI):
Avete una CA interna (Microsoft ADCS o equivalente)?
Chi può emettere certificati? Esistono template pericolosi (ESC1-ESC8)?
I certificati emessi vengono monitorati per uso anomalo?
> *(→ `graph_edges[]` tipo ISSUES_CERTS_TO, `security_controls[]` CTRL-AD-PKI)*

---

**F3.** Legacy Protocol Risk:
- NTLM è ancora attivo? Per quali sistemi è necessario?
- SMBv1 è ancora attivo (vettore classico di EternalBlue/WannaCry)?
- Kerberos RC4 encryption è ancora abilitato (vettore di Kerberoasting)?
> *(→ note su `ot_context.allowed_protocols` e eccezioni attive)*

---

**F4.** Monitoraggio Avanzato AD:
- Avete uno strumento di AD Threat Detection (Microsoft Defender for Identity, CrowdStrike Falcon, Semperis)?
- Viene monitorato il replication traffic tra DC (vettore DCSync)?
- Avete snapshot/baseline della configurazione AD per rilevare modifiche non autorizzate?
> *(→ `security_controls[]` CTRL-AD-THREATDETECT)*

---

## BLOCCO G — Contesto per l'AI (Narrativa di Rischio)
*Obiettivo: raccogliere il "perché" narrativo per le analisi AI.*

---

**G1.** In una frase: perché AD è il sistema più critico dell'intera infrastruttura?
> *(→ `reasoning_for_ai.logic_inference`)*

---

**G2.** Se AD venisse compromesso (attaccante = Domain Admin), descrivete l'effetto a cascata
su ogni sistema aziendale critico — in ordine di impatto:
> *(→ `reasoning_for_ai.failure_cascading_effect`)*

---

**G3.** Comportamenti rischiosi da evitare:
(es. "non usare l'account DA per la navigazione quotidiana", "non dare Domain Admin temporaneo ai consulenti")
> *(→ `reasoning_for_ai.training_notes`)*

---

**G4.** 3–5 parole chiave che catturano l'essenza di rischio di AD:
> *(→ `reasoning_for_ai.semantic_tags`)*

---

## BLOCCO H — Verifica Finale e Gap Aperti

| Campo BASM | Stato | Note |
|---|---|---|
| `identity_context` completo (topologia forest/domain) | ☐ | |
| `hourly_downtime_cost` > 0 con impatto su tutti i dipendenti | ☐ | |
| `rto_hours` / `rpo_hours` realistici e testati | ☐ | |
| Domain Admin count ≤ 5 e documentati | ☐ | |
| `security_controls` ≥ 7 (EDR, PAM, MFA, Backup, Patch, Log, Hardening) | ☐ | |
| Account privilegiati con PAM o equivalente | ☐ | |
| Legacy protocols (NTLM, SMBv1, RC4) verificati | ☐ | |
| `graph_edges` per ogni sistema che usa AD per autenticazione | ☐ | |
| Playbook Golden Ticket / Forest Recovery referenziato | ☐ | |
| `reasoning_for_ai` compilato con effetto cascata | ☐ | |
| Eccezioni attive (account mai scaduti, trust obsoleti) documentate | ☐ | |

---

**Punteggio BASM stimato post-intervista:**

| Blocco | Peso | Score stimato |
|---|---|---|
| A — Identità | 10% | /10 |
| B — Business Impact | 20% | /20 |
| C — Architettura | 15% | /15 |
| D — Controlli | 25% | /25 |
| E — Resilienza | 15% | /15 |
| F — Hardening Avanzato | 10% | /10 |
| G — Narrativa AI | 5% | /5 |
| **TOTALE** | **100%** | **/100** |

---

*Template BASM v3.0-DIGITAL-TWIN — Interview Guide Active Directory / IAM*
*Generato: 2026-03-08 | Per uso interno — classificazione: CONFIDENTIAL*
