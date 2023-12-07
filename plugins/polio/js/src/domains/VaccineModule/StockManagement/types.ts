/* eslint-disable camelcase */
export type StockManagementListParams = {
    order?: string;
    pageSize?: string; // number as string
    page?: string; // number as string
    accountId: string; // number as string
    search?: string;
    country_id?: string; // number as string
    vaccine_type?: string;
};

export type TabValue = 'usableVials' | 'unusableVials';

export type StockManagementDetailsParams = {
    accountId: string; // number as string
    id: string; // number as string
    tab: TabValue;
    unusableVialsPageSize: string; // number as string
    unusableVialsPage: string; // number as string
    unusableVialsOrder: string;
    usableVialsPageSize: string; // number as string
    usableVialsPage: string; // number as string
    usableVialsOrder: string;
};

export type StockVariationTab = 'forma' | 'destruction' | 'incident';

export type StockVariationParams = {
    accountId: string; // number as string
    id: string; // number as string
    tab: StockVariationTab;
    formaPageSize: string; // number as string
    formaPage: string; // number as string
    formaOrder: string;
    destructionPageSize: string; // number as string
    destructionPage: string; // number as string
    destructionOrder: string;
    incidentPageSize: string; // number as string
    incidentPage: string; // number as string
    incidentOrder: string;
};
