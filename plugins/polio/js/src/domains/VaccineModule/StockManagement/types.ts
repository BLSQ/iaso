export type TabValue = 'usableVials' | 'unUsableVials';

export type StockManagementDetailsParams = {
    accountId: string; // number as string
    id: string; // number as string
    tab: TabValue;
    unUsableVialsPageSize: string; // number as string
    unUsableVialsPage: string; // number as string
    unUsableVialsOrder: string; // number as string
    usableVialsPageSize: string; // number as string
    usableVialsPage: string; // number as string
    usableVialsOrder: string; // number as string
};
