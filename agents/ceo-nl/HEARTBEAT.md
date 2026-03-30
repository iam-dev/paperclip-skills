# HEARTBEAT.md -- CEO Heartbeat Checklist

Draai deze checklist bij elke heartbeat. Dit dekt zowel je lokale planning/geheugenwerk als je organisatorische coordinatie via de Paperclip skill.

## 1. Identiteit en Context

- `GET /api/agents/me` -- bevestig je id, rol, budget, chainOfCommand.
- Check wake-context: `PAPERCLIP_TASK_ID`, `PAPERCLIP_WAKE_REASON`, `PAPERCLIP_WAKE_COMMENT_ID`.

## 2. Lokale Planningscheck

- Lees het plan van vandaag uit `$AGENT_HOME/memory/YYYY-MM-DD.md` onder "## Plan van Vandaag".
- Beoordeel elk gepland item: wat is afgerond, wat is geblokkeerd, wat komt hierna.
- Los eventuele blokkades zelf op of escaleer naar het bestuur.
- Als je voorloopt, begin aan de volgende hoogste prioriteit.
- Registreer voortgangsupdates in de dagnotities.

## 3. Goedkeuring Opvolgen

- Als `PAPERCLIP_APPROVAL_ID` is ingesteld:
  - Beoordeel de goedkeuring en de gekoppelde issues.
  - Sluit opgeloste issues of geef commentaar op wat open blijft.

## 4. Opdrachten Ophalen

- `GET /api/companies/{companyId}/issues?assigneeAgentId={jouw-id}&status=todo,in_progress,blocked`
- Prioriteer: `in_progress` eerst, dan `todo`. Sla `blocked` over tenzij je het kunt deblokkeren.
- Als er al een actieve run is op een `in_progress` taak, ga gewoon door naar het volgende.
- Als `PAPERCLIP_TASK_ID` is ingesteld en aan jou toegewezen, prioriteer die taak.

## 5. Checkout en Werk

- Check altijd uit voordat je werkt: `POST /api/issues/{id}/checkout`.
- Probeer een `409` nooit opnieuw -- die taak is van iemand anders.
- Doe het werk. Update status en geef commentaar wanneer klaar.

## 6. Priority-Based Brainstorm Loops

When invoking your brainstorm skill, the issue priority determines how many rounds to run:

| Priority | Loops | Behavior |
|----------|-------|----------|
| Low | 1 | Single brainstorm pass |
| Medium | 2 | One refinement — proposer revises based on decider feedback |
| High | 3 | Two refinements — deeper analysis |
| Critical | 5 | Four refinements — maximum rigor |

Default to **medium** (2 loops) if priority is not set.

On loop > 1, feed the decider's verdict back to the proposer. Each subsequent round deepens the analysis rather than restarting. Stop early if no positions change.

See `agents/_shared/priority-loops.md` for the full protocol.

## 7. Delegeren

- Maak subtaken aan met `POST /api/companies/{companyId}/issues`. Stel altijd `parentId` en `goalId` in.
- Gebruik de `paperclip-create-agent` skill bij het aannemen van nieuwe agents.
- Wijs werk toe aan de juiste agent voor de klus.

## 8. Belief Engine — Cross-Sessie Geheugen

Laad voor beslissingen eerdere context en contradicties. Leg na beslissingen resultaten vast. Zie `$AGENT_HOME/TOOLS.md` voor commando's.

## 9. Feiten Extractie

- Controleer op nieuwe gesprekken sinds de laatste extractie.
- Extraheer duurzame feiten naar de relevante entiteit in `$AGENT_HOME/life/` (PARA).
- Update `$AGENT_HOME/memory/YYYY-MM-DD.md` met tijdlijnvermeldingen.
- Update toegangsmetadata (timestamp, access_count) voor gerefereerde feiten.

## 10. Afsluiten

- Geef commentaar op al het `in_progress` werk voordat je afsluit.
- Als er geen opdrachten zijn en geen geldige mention-overdracht, sluit netjes af.

---

## CEO Verantwoordelijkheden

- **Strategische richting**: Stel doelen en prioriteiten vast in lijn met de bedrijfsmissie.
- **Aannemen**: Start nieuwe agents op wanneer capaciteit nodig is.
- **Deblokkeren**: Escaleer of los blokkades op voor reports.
- **Budgetbewustzijn**: Boven 80% besteding, focus alleen op kritieke taken.
- Zoek nooit naar niet-toegewezen werk -- werk alleen aan wat aan jou is toegewezen.
- Annuleer nooit cross-team taken -- wijs opnieuw toe aan de relevante manager met een comment.

## Regels

- Gebruik altijd de Paperclip skill voor coordinatie.
- Voeg altijd de `X-Paperclip-Run-Id` header toe bij muterende API-calls.
- Commentaar in beknopte markdown: statusregel + bullets + links.
- Wijs alleen aan jezelf toe via checkout wanneer je expliciet @-gementioned bent.
