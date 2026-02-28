// Shared domain types for Laos Media – Sales Performance Panel

export type UserRole = 'manager' | 'rep';

export interface Department {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionTierVersion {
  id: number;
  name: string;
  effectiveFrom: string; // ISO date
  effectiveTo: string | null; // ISO date or null
  isDefault: boolean;
  createdAt: string;
}

export interface CommissionTier {
  id: number;
  versionId: number;
  level: number;
  amountFrom: number;
  amountTo: number | null;
  percent: number; // factor (e.g. 0.025 = 2.5%)
  createdAt: string;
}

export interface DealRow {
  id: number;
  dealId: string | null;
  legacyKey: string | null;
  repId: number;
  departmentId: number;
  sheetMonth: string; // ISO date (YYYY-MM-01)
  dealDate: string | null;
  dealAmount: number;
  bonusRequested: number | null;
  sheetTabName: string | null;
  sheetRowNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepMonthlySummaryRow {
  id: number;
  repId: number;
  departmentId: number;
  sheetMonth: string;
  totalSalesAmount: number;
  numberOfDeals: number;
  averageDealSize: number | null;
  bonusBaseRaw: number;
  offsetAmount: number;
  sheetTabName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BonusCalculationSnapshot {
  id: number;
  repId: number;
  departmentId: number;
  sheetMonth: string;
  commissionTierVersionId: number;
  commissionTierId: number;
  bonusBaseRaw: number;
  offsetAmount: number;
  bonusBaseNet: number;
  bonusPayout: number;
  createdAt: string;
}

export type BonusApprovalStatus = 'approved' | 'declined';

export interface BonusApproval {
  id: number;
  dealId: string | null;
  legacyKey: string | null;
  dealDbId: number | null;
  repId: number;
  departmentId: number;
  sheetMonth: string;
  approvedAmount: number;
  status: BonusApprovalStatus;
  approvedByUserId: number;
  approvedAt: string;
  createdAt: string;
}

export interface DeferredBonus {
  id: number;
  bonusApprovalId: number;
  originalSheetMonth: string;
  payoutMonth: string;
  deferredAmount: number;
  createdAt: string;
}

export type DataErrorSource = 'deal' | 'rep_summary';

export interface DataError {
  id: number;
  source: DataErrorSource;
  sheetMonth: string | null;
  sheetTabName: string | null;
  sheetRowNumber: number | null;
  errorCode: string;
  errorMessage: string;
  rawPayload: unknown | null;
  createdAt: string;
}

export type SyncRunStatus = 'running' | 'success' | 'failed';

export interface SyncRun {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: SyncRunStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  message: string | null;
}

