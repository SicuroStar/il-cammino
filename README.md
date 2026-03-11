# BASM v4.0-STIX-LITE

**Business Application Security Model** — modello JSON per la valutazione della postura di sicurezza degli asset aziendali, basato sul vocabolario STIX 2.1 con estensioni formali BASM.

---

## Struttura del repo

```
schema/
  basm.schema.v4.json       JSON Schema Draft-07 (validabile con AJV)
sample/
  basm-conveyor-plc.v4.json Documento campione: PLC Siemens S7-1500, Linea A
```

---

## Architettura del modello

Ogni documento BASM è un **bundle STIX 2.1** (`type: "bundle"`) che contiene:

| Tipo oggetto | Ruolo nel modello |
|---|---|
| `extension-definition` | Registrazione formale dell'estensione BASM |
| `identity` | Business owner — chi subisce il danno economico |
| `software` | Il sistema logico da valutare (crown jewel) — porta BIA e classificazione |
| `infrastructure` | Asset fisico (server, PLC, VM) — porta contesto OT/ICS |
| `course-of-action` | Controllo di sicurezza — porta status, staleness, mapping normativo, economics |
| `threat-actor` | Attore di minaccia rilevante |
| `attack-pattern` | Tecnica MITRE ATT&CK o scenario di attacco |
| `relationship` | Connessione tipizzata tra oggetti (ex graph_edges) |
| `artifact` | Evidence artifact con hash SHA-256 |
| `incident` | Incidente storico |

I campi BASM-native (maturity scoring, FAIR risk, snapshot history, RAG chunks) vivono come `x_basm_*` sul root del bundle.

Le estensioni su ogni oggetto seguono il meccanismo formale STIX 2.1:
```json
"extensions": {
  "extension-definition--basm-ext": {
    "extension_type": "property-extension",
    "x_basm_criticality": "Tier-1-Gold",
    ...
  }
}
```

---

## Validazione

```bash
npm install -g ajv-cli

ajv validate -s schema/basm.schema.v4.json -d sample/basm-conveyor-plc.v4.json
# atteso: sample/basm-conveyor-plc.v4.json valid
```
