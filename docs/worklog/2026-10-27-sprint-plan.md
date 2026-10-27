# Sprint plan: three lanes, four sprints

Goal: help Customer Success clear the onboarding queue. Working software at the end of every sprint;
cut every slice as thin as it will go.

Branch: `shared/onboarding-colton-sarunas`. Repo: https://github.com/coltonpeffer/OnboardingSampleApp

## Lanes

Each lane owns its own files so three people can build at once without stepping on each other.

| Lane | Owner | Tab | Owns these files |
|---|---|---|---|
| **A: Queue** | _TBD_ | Dashboard, Tenant Setup | `client/src/tabs/Dashboard.jsx`, `client/src/tabs/TenantSetup.jsx`, `server/src/routes/queue.js`, seed data in `server/src/data/store.js` |
| **B: Customer Info** (start here) | _TBD_ | Customer Info, Import | `client/src/tabs/CustomerInfo.jsx`, `client/src/tabs/Import.jsx`, `server/src/routes/customerInfo.js`, `server/src/csv/` |
| **C: Mapping** | _TBD_ | Data Mapping | `client/src/tabs/DataMapping.jsx`, `server/src/routes/mapping.js`, `server/src/mapping/` |

**Shared files** (`client/src/App.jsx`, `server/src/index.js`): touch only to add one line that wires in
your tab or your routes. Small edits there merge cleanly.

## Sprints

| Sprint | A: Queue | B: Customer Info | C: Mapping |
|---|---|---|---|
| **1** | Queue shows ABC, XYZ and Premier. CS can mark a step done and progress moves. | Pick a customer, see their `clients.csv` as a table. | Read-only cheat sheet: which column means what, per customer. |
| **2** | Sort or flag who's blocked and who's next. | Flag bad rows: unquoted commas (XYZ `Williams, Robert`), unparseable dates. | Auto-rename columns to standard names for the known customers. |
| **3** | "Provision tenant": pending to active, step completes. | Load contacts, chart of accounts and transactions too. | Translate values (`A` / `Active` / `ACTIVE` to Active) and normalize dates. |
| **4** | End to end for one customer: all four steps done, 100%. | Import marks the step complete and shows a summary count. | CS can fix a wrong mapping by hand. |

## Hand-offs between lanes

- **B to C (sprint 2):** B's parsed rows are C's input. Agree the shape at the start of sprint 2: an array
  of `{ column: value }` objects, one per row, with the customer's original column names.
- **C to B (sprint 3):** B's Import uses C's mapping to produce standard rows.
- **A from B and C (sprint 3-4):** finishing a step in B or C marks that step done on the dashboard.
  Agree one call (mark step N done for customer X) at the start of sprint 3.

## Rules

- **Keep it working.** `just test` passes before every push. A regression CS reports comes before new work.
- **Lane A sprint 1 changes the queue.** Keep Acme in the seed data, or update
  `tests/e2e/dashboard.spec.js` in the same commit.
- **Small commits, often.** `git pull --rebase` before every push. Sprints are minutes long, so don't
  use long-lived branches.
- **Restarts wipe data.** Storage is in memory. Don't restart the server mid-demo.

## Known traps in the data

- XYZ `clients.csv` has unquoted commas inside names, so a split-on-comma parser shifts every column after them.
- Dates: ABC is MM/DD/YYYY, XYZ is YYYY-MM-DD, Premier is DD-MM-YYYY. `01/02/2023` and `01-02-2023`
  mean different days.
- Full schema and picklist differences: `sample-data/README.md`.
