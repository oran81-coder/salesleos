export let mockUsers = [
    { id: 1, full_name: 'נציג א׳', sheet_name: 'נציג א׳', email: 'repA@laos.co.il', role: 'rep', department_id: 1, is_active: 1 },
    { id: 2, full_name: 'נציג ב׳', sheet_name: 'נציג ב׳', email: 'repB@laos.co.il', role: 'rep', department_id: 1, is_active: 1 },
    { id: 3, full_name: 'נציג ג׳', sheet_name: 'נציג ג׳', email: 'repC@laos.co.il', role: 'rep', department_id: 1, is_active: 1 },
    { id: 4, full_name: 'מנהל המערכת', sheet_name: 'מנהל', email: 'manager@laos.co.il', role: 'manager', department_id: 1, is_active: 1 },
];

export let mockDepartments = [
    { id: 1, name: 'מכירות' },
];

// Keyed by month (YYYY-MM-01)
export let mockLeaderboardStore: Record<string, any[]> = {
    '2024-03-01': [
        {
            repId: 1,
            repName: 'נציג א׳',
            departmentName: 'מכירות',
            TotalSales: 85000,
            ActualCollection: 78000,
            DealsCount: 12,
            Target: 70000,
            TargetAchievement: 121.4,
            AvgDealSize: 7083.33,
            BonusBaseRaw: 85000,
            Offset: 0,
            BonusBaseNet: 85000,
            rank: 1
        },
        {
            repId: 2,
            repName: 'נציג ב׳',
            departmentName: 'מכירות',
            TotalSales: 55000,
            ActualCollection: 52000,
            DealsCount: 8,
            Target: 70000,
            TargetAchievement: 78.5,
            AvgDealSize: 6875,
            BonusBaseRaw: 55000,
            Offset: 5000,
            BonusBaseNet: 50000,
            rank: 2
        },
        {
            repId: 3,
            repName: 'נציג ג׳',
            departmentName: 'מכירות',
            TotalSales: 25000,
            ActualCollection: 20000,
            DealsCount: 4,
            Target: 70000,
            TargetAchievement: 35.7,
            AvgDealSize: 6250,
            BonusBaseRaw: 25000,
            Offset: 0,
            BonusBaseNet: 25000,
            rank: 3
        }
    ],
    '2024-02-01': [
        {
            repId: 1,
            repName: 'נציג א׳',
            departmentName: 'מכירות',
            TotalSales: 60000,
            ActualCollection: 58000,
            DealsCount: 10,
            Target: 70000,
            TargetAchievement: 85.7,
            AvgDealSize: 6000,
            BonusBaseRaw: 60000,
            Offset: 0,
            BonusBaseNet: 60000,
            rank: 2
        },
        {
            repId: 2,
            repName: 'נציג ב׳',
            departmentName: 'מכירות',
            TotalSales: 75000,
            ActualCollection: 72000,
            DealsCount: 11,
            Target: 70000,
            TargetAchievement: 107.1,
            AvgDealSize: 6818,
            BonusBaseRaw: 75000,
            Offset: 0,
            BonusBaseNet: 75000,
            rank: 1
        },
        {
            repId: 3,
            repName: 'נציג ג׳',
            departmentName: 'מכירות',
            TotalSales: 30000,
            ActualCollection: 28000,
            DealsCount: 5,
            Target: 70000,
            TargetAchievement: 42.8,
            AvgDealSize: 6000,
            BonusBaseRaw: 30000,
            Offset: 1000,
            BonusBaseNet: 29000,
            rank: 3
        }
    ]
};

export let mockTiers = [
    { level: 1, from: 0, to: 30000, percent: 0 },
    { level: 2, from: 30000, to: 40000, percent: 0.025 },
    { level: 3, from: 40000, to: 50000, percent: 0.035 },
    { level: 4, from: 50000, to: 60000, percent: 0.045 },
    { level: 5, from: 60000, to: 70000, percent: 0.055 },
    { level: 6, from: 70000, to: 80000, percent: 0.065 },
    { level: 7, from: 80000, to: 90000, percent: 0.075 },
    { level: 8, from: 90000, to: 100000, percent: 0.085 },
    { level: 9, from: 100000, to: null, percent: 0.09 },
];

export let mockDeals = [
    { id: 1, deal_id: 'D-1001', rep_id: 1, department_id: 1, sheet_month: '2024-03-01', deal_amount: 15000, bonus_requested: 1500, deal_date: '2024-03-05', is_renewal: false },
    { id: 2, deal_id: 'D-1002', rep_id: 1, department_id: 1, sheet_month: '2024-03-01', deal_amount: 20000, bonus_requested: 2000, deal_date: '2024-03-10', is_renewal: true },
    { id: 3, deal_id: 'D-1003', rep_id: 1, department_id: 1, sheet_month: '2024-03-01', deal_amount: 50000, bonus_requested: 5000, deal_date: '2024-03-15', is_renewal: false },
    { id: 4, deal_id: 'D-2001', rep_id: 2, department_id: 1, sheet_month: '2024-03-01', deal_amount: 30000, bonus_requested: 3000, deal_date: '2024-03-07', is_renewal: false },
    { id: 5, deal_id: 'D-2002', rep_id: 2, department_id: 1, sheet_month: '2024-03-01', deal_amount: 25000, bonus_requested: 2500, deal_date: '2024-03-22', is_renewal: true },
];

export let mockApprovals = [
    { id: 1, deal_db_id: 1, rep_id: 1, approved_amount: 1500, status: 'approved', sheet_month: '2024-03-01' },
];

export let mockDeferredBonuses = [];
