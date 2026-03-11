# BASM — Intervista Business Owner (Crown Jewel)

> **Come usare questo documento**
> Questo questionario è rivolto al **business owner** del sistema: la persona che subisce il danno economico se il sistema non è disponibile. Non è richiesta nessuna competenza tecnica. Compilare le sezioni da 1 a 10. I campi con `*` sono obbligatori. Per le domande sui numeri, una stima è sempre meglio del silenzio. Il team di sicurezza integrerà i dati tecnici in una fase successiva.
>
> **Durata stimata:** 45–60 minuti
> **Formato:** Testo libero nelle aree di risposta — non è richiesta nessuna sintassi speciale.

---

## Informazioni generali (per uso interno del Security Team)

| Campo | Valore |
|---|---|
| App ID (compilare con il Security Team) | `APP-ID: ___________________________` |
| Data intervista | `DATA: ___________________________` |
| Interviewer | `NOME: ___________________________` |
| Business owner (nome e cognome) | `NOME: ___________________________` |
| Email business owner | `EMAIL: ___________________________` |

---

## SEZIONE 1 — Identità del Sistema

> *Vogliamo capire di che sistema si tratta, che nome ha, chi lo gestisce e da quanto tempo è in uso.*

**1.1* Come si chiama il sistema? (nome ufficiale o nome con cui lo conosci)**

```
Risposta: _______________________________________________

Esempio: "Sistema PLC Rullo Trasportatore Linea A"
         "ERP SAP S/4HANA"
         "Portale Cliente MyCompany"
```

**1.2* Chi è il fornitore e qual è il prodotto / la versione, se la conosci?**

```
Risposta: _______________________________________________

Esempio: "Siemens S7-1500, firmware v3.12.4"
         "SAP SE — SAP S/4HANA 2023"
         "Sviluppato internamente, versione 4.2"
```

**1.3 Da quanto tempo è in produzione? C'è una data di dismissione pianificata?**

```
Risposta: _______________________________________________
```

**1.4* Chi è responsabile del sistema dal punto di vista IT/Operations? (nome, ruolo, email)**

```
Risposta: _______________________________________________

Esempio: "Roberto Conti — Direttore Operations — r.conti@azienda.it"
```

**1.5 Il sistema è accessibile dall'esterno (internet, partner, clienti)?**

```
[ ] No — solo uso interno
[ ] Sì, è esposto verso partner/fornitori
[ ] Sì, è esposto verso clienti finali (internet)
[ ] Non so

Note: _______________________________________________
```

---

## SEZIONE 2 — Ruolo nel Processo Aziendale

> *Vogliamo capire a quale catena del valore appartiene il sistema e cosa succederebbe se venisse bloccato.*

**2.1* A quale processo aziendale principale è collegato il sistema?**

```
Risposta: _______________________________________________

Esempio: "Order-to-Cash — Produzione Linea A"
         "Purchase-to-Pay — Ordini fornitori"
         "Customer Service — Gestione reclami"
```

**2.2* Descrivi cosa fa il sistema in 3–5 frasi semplici. Cosa gestisce, cosa produce, chi lo usa ogni giorno?**

```
Risposta:
_______________________________________________
_______________________________________________
_______________________________________________
```

**2.3* Quali altri sistemi dipendono da questo per funzionare? (elenca i nomi che conosci)**

```
Risposta: _______________________________________________

Esempio: "Se il PLC si ferma, si ferma il SCADA che controlla la linea,
          poi si ferma la reportistica sul gestionale SAP."
```

**2.4 Chi usa il sistema ogni giorno? Quante persone circa?**

```
Risposta: _______________________________________________

Esempio: "5 operatori di linea + 2 supervisori di turno"
         "Tutta la rete vendita, circa 120 persone"
```

---

## SEZIONE 3 — Impatto Economico del Downtime

> *Questa è la sezione più importante. I numeri non devono essere precisi al centesimo — una stima onesta è sufficiente.*

**3.1* Se il sistema si fermasse completamente per 1 ora, quanto perderebbe l'azienda? (in EUR)**

```
Risposta: EUR _______________________________________________

Come stimarlo: pensa a ordini persi, produzione ferma, ore-uomo sprecate,
               penali contrattuali, costi straordinari.

Esempio: "€ 18.500 — si ferma la linea A che produce 120 pezzi/ora a €154/pezzo"
```

**3.2 Se il sistema fosse fermo per un anno (scenario estremo), quale sarebbe il fatturato a rischio? (in EUR)**

```
Risposta: EUR _______________________________________________

Esempio: "€ 3.256.000 — è la quota di fatturato annuo dipendente da questa linea"
```

**3.3 L'azienda ha una polizza cyber insurance? Se sì, sai di quanti EUR copre questo asset?**

```
[ ] Non so
[ ] No, non abbiamo polizza cyber
[ ] Sì, copertura stimata: EUR _______________________________________________

Note: _______________________________________________
```

**3.4 Oltre al danno diretto, ci sono altri costi in caso di blocco prolungato?**

```
[ ] Sanzioni regolamentari (es. GDPR, NIS2, contratti di fornitura)
[ ] Costi legali
[ ] Danno reputazionale stimabile (perdita clienti)
[ ] Ripristino dati e forensica
[ ] Nessuno di questi
[ ] Altro: _______________________________________________
```

---

## SEZIONE 4 — Recovery e Continuità Operativa

**4.1* Entro quanto tempo il sistema DEVE essere ripristinato per non causare danni irreversibili? (Recovery Time Objective — RTO)**

```
Risposta: _______________ ore

Esempio: "4 ore — oltre le 4 ore il cliente LogiPartner attiva le penali contrattuali"
```

**4.2 Qual è la massima perdita di dati accettabile in caso di ripristino? (Recovery Point Objective — RPO)**

```
Risposta: _______________ ore (es. "possiamo perdere max 1 ora di dati")

Esempio: "1 ora — il backup viene eseguito ogni ora"
```

**4.3 Esiste un piano di continuità operativa (BCP/DRP) per questo sistema?**

```
[ ] Sì, è documentato e testato
[ ] Sì, è documentato ma non testato di recente
[ ] Esiste qualcosa ma non è formalizzato
[ ] No

Quando è stato testato l'ultima volta (se sì): _______________________________________________
Come è andato il test: [ ] Superato completamente  [ ] Superato parzialmente  [ ] Fallito
```

**4.4 Esiste una modalità operativa degradata (es. processo manuale, sistema di backup) se il sistema si ferma?**

```
[ ] Sì — descrivi: _______________________________________________
[ ] No — il blocco è totale

Per quanto tempo si può operare in modalità degradata (stima):
_______________ minuti / ore
```

**4.5 Oltre quale durata di downtime l'azienda deve notificare il Consiglio di Amministrazione o il CEO?**

```
Risposta: _______________ ore
```

---

## SEZIONE 5 — Clienti e Partner Esposti

> *Vogliamo capire se ci sono clienti o partner che dipendono da questo sistema e se esistono SLA o penali contrattuali.*

**5.1 Ci sono clienti o partner che dipendono direttamente dal funzionamento di questo sistema?**

```
[ ] No
[ ] Sì — compila la tabella sotto

| Nome cliente / partner | Fatturato annuo con questo cliente (EUR) | SLA — tempo max di fermo tollerato | Penale per ora di downtime (EUR) |
|---|---|---|---|
| ___________________ | ___________________ | _______________ ore | ___________________ |
| ___________________ | ___________________ | _______________ ore | ___________________ |
| ___________________ | ___________________ | _______________ ore | ___________________ |
```

**5.2 In caso di violazione degli SLA, ci sono procedure automatiche di notifica verso il cliente?**

```
Risposta: _______________________________________________
```

---

## SEZIONE 6 — Schedulazione e Produzione (compilare solo per sistemi OT/Industriali)

> *Salta questa sezione se il sistema non è un sistema di controllo industriale, PLC, SCADA o simile.*

**6.1 Il sistema opera su una linea di produzione fisica?**

```
[ ] No — vai alla Sezione 7
[ ] Sì — continua
```

**6.2 Qual è il calendario operativo?**

```
Giorni di lavoro a settimana: _______
Turni al giorno: _______
Ore per turno: _______
```

**6.3 Qual è la capacità produttiva?**

```
Unità prodotte per ora: _______
Ricavo per unità (EUR): _______
Percentuale di utilizzo media: _______ %
```

**6.4 Ci sono linee di produzione parallele che possono assorbire il carico in caso di fermo?**

```
[ ] Sì — linee: _______________________________________________
[ ] No — il fermo è totale
[ ] Parzialmente — max _______ % del carico può essere spostato
```

---

## SEZIONE 7 — Asset Fisico e Localizzazione

**7.1* Dove si trova fisicamente il sistema? (città, stabilimento, edificio)**

```
Risposta: _______________________________________________

Esempio: "Stabilimento ACMEFAB-MIL-01 — Via Industria 14, Milano"
```

**7.2 È un sistema fisico (hardware dedicato) o gira su server / cloud condiviso?**

```
[ ] Hardware dedicato (PLC, server fisico, appliance)
[ ] Server virtuale on-premise (VM)
[ ] Cloud (AWS, Azure, GCP, altro)
[ ] SaaS (gestito dal fornitore, es. SAP Cloud)
[ ] Ibrido

Dettagli: _______________________________________________
```

**7.3 Il sistema è connesso a internet o a reti esterne?**

```
[ ] Completamente isolato (air-gap)
[ ] Connesso solo alla rete aziendale interna
[ ] Connesso a internet (anche se solo per aggiornamenti)
[ ] Connesso a reti di partner / fornitori
[ ] Non so
```

**7.4 Esiste un identificativo CMDB o asset tag per questo sistema?**

```
Risposta (es. "OT-PLC-00142" o "CMDB-12345"): _______________________________________________
```

**7.5 Chi sono i responsabili fisici dell'asset? (es. responsabile dello stabilimento, plant manager)**

```
Nome e ruolo: _______________________________________________
```

---

## SEZIONE 8 — Classificazione e Sensibilità dei Dati

**8.1* Che tipo di dati gestisce o transita nel sistema? (seleziona tutto quello che si applica)**

```
[ ] Dati pubblici (nessuna sensibilità)
[ ] Dati interni aziendali (non pubblici ma non sensibili)
[ ] Dati riservati (es. piani industriali, prezzi, contratti)
[ ] Dati personali di dipendenti (GDPR)
[ ] Dati personali di clienti (GDPR)
[ ] Dati sanitari
[ ] Dati finanziari / contabili
[ ] Segreti industriali / IP
[ ] Dati di sicurezza (piani di emergenza, configurazioni di sicurezza)
[ ] Nessun dato significativo (solo comandi operativi)
```

**8.2* Quanto è critico questo sistema per il business aziendale?**

```
[ ] Critico di primo livello — il business si ferma senza di esso
[ ] Critico — impatto grave ma c'è un workaround parziale
[ ] Importante — impatto moderato, si riesce a operare con difficoltà
[ ] Accessorio — si può fare a meno per giorni senza impatto grave
```

**8.3 Il sistema è in produzione, test, sviluppo o disaster recovery?**

```
[ ] Produzione (sistema principale attivo)
[ ] Staging / pre-produzione
[ ] Sviluppo
[ ] Disaster Recovery (usato solo in caso di emergenza)
[ ] Test
```

---

## SEZIONE 9 — Obblighi Legali e Normativi

**9.1 Quali normative o regolamenti si applicano a questo sistema o ai dati che gestisce?**

```
[ ] GDPR (dati personali UE)
[ ] NIS2 (sicurezza reti e sistemi informativi — settori critici)
[ ] ISO 27001 (certificazione aziendale)
[ ] IEC 62443 (sistemi di controllo industriale OT)
[ ] PCI-DSS (pagamenti con carta)
[ ] SOC 2
[ ] Direttiva Macchine 2006/42/CE
[ ] Normativa di settore specifica: _______________________________________________
[ ] Nessuna normativa specifica nota
[ ] Non so
```

**9.2 Ci sono audit regolatori pianificati che coinvolgono questo sistema?**

```
[ ] Sì — prossimo audit: _______________________________________________
[ ] No
[ ] Non so
```

**9.3 Ci sono requisiti legali specifici su dove devono essere conservati i dati? (data residency)**

```
[ ] Sì — i dati devono rimanere in: _______________________________________________
[ ] No
[ ] Non so
```

---

## SEZIONE 10 — Storico Incidenti e Rischi Percepiti

**10.1 Negli ultimi 3 anni, ci sono stati incidenti significativi che hanno causato fermi o perdite di dati su questo sistema?**

```
[ ] No
[ ] Sì — descrivi brevemente:

| Anno circa | Cosa è successo | Durata del fermo | Impatto economico stimato (EUR) |
|---|---|---|---|
| _______ | ___________________________ | _______ ore | ___________________ |
| _______ | ___________________________ | _______ ore | ___________________ |
```

**10.2 Quali sono i rischi che ti preoccupano di più per questo sistema? (rispondete liberamente)**

```
Risposta:
_______________________________________________
_______________________________________________
```

**10.3 Ci sono dipendenze critiche da fornitori esterni per il funzionamento o la manutenzione del sistema?**

```
[ ] No
[ ] Sì — fornitore: _______________________________________________
  Tipo di dipendenza: _______________________________________________
  C'è un contratto di manutenzione attivo: [ ] Sì  [ ] No  [ ] Non so
```

**10.4 Ci sono piani di aggiornamento o sostituzione del sistema nei prossimi 12–24 mesi?**

```
[ ] No
[ ] Sì — descrivi: _______________________________________________
[ ] In valutazione
```

---

## Note finali del Business Owner

> *Aggiungi qui qualsiasi informazione aggiuntiva che ritieni rilevante per la valutazione della sicurezza di questo sistema.*

```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

> **Uso interno — Security Team**
> Una volta completata questa intervista, compilare la scheda `integrazione-security-team.md` con i dati tecnici (controlli, CVE, topology di rete, FAIR risk). Entrambe le schede vengono poi passate a Claude con il prompt `prompt-intervista-to-basm.md` per generare il documento BASM v4.1 JSON.
