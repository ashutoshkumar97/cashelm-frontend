# Cashelm — Build Checklist

## Phase 1 — Display Transactions
- [ ] Create `Transaction` model (id, date, description, amount, type, balance, remark, isSelected)
- [ ] Create `TransactionService` with `uploadStatement()` and `transactions$` BehaviorSubject
- [ ] Create `UploadComponent` (just the file input + calls service)
- [ ] Create `TransactionTableComponent` (reads from service, renders table)
- [ ] Wire everything into `AppComponent`

## Phase 2 — Remarks
- [ ] Add remark column to table (read-only by default)
- [ ] Click remark cell → turns into input
- [ ] Blur or Enter → saves remark back to backend via `updateRemark(id, remark)`

## Phase 3 — Selection
- [ ] Add checkbox column to table
- [ ] Track selected rows via `isSelected` on the Transaction model
- [ ] Show count of selected transactions somewhere

## Phase 4 — Export
- [ ] Install `jsPDF` and `jspdf-autotable`
- [ ] Create `ExportService` that reads selected transactions and generates PDF
- [ ] PDF includes: date, description, amount, remark
- [ ] Add export button (only visible when at least one row is selected)
