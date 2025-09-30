type Project = {
    id: number;
    name: string;
};
type OrgUnitType = {
    id: number;
    name: string;
};
type Form = {
    id: number;
    name: string;
};
type StockKeepingUnitChild = {
    id: number;
    name: string;
    value: number;
};
type User = {
    id: number;
    name: string;
};

export type StockKeepingUnit = {
    id: number;
    name: string;
    short_name: string;
    projects: Project[];
    org_unit_types: OrgUnitType[];
    forms: Form[];
    children: StockKeepingUnitChild[];
    display_unit?: string;
    display_precision: number;
    created_at: number;
    created_by: User;
    updated_at: number;
    updated_by: User;
};

export type StockKeepingUnitDto = {
    id: number;
    name: string;
    short_name: string;
    projects: number[];
    org_unit_types: number[];
    forms: number[];
    children: number[];
    display_unit?: string;
    display_precision: number;
};

export type StockItemRuleDto = {
    id: number;
    sku: number;
    form: number;
    question: string;
    impact: Impact;
    order: number;
};

type ShortSKU = {
    id: number;
    name: string;
    short_name: string;
};

export type Impact = 'ADD' | 'SUBTRACT' | 'RESET';
export type StockItemRule = {
    id: number;
    version_id: number;
    sku: ShortSKU;
    form: Form;
    question: string;
    impact: Impact;
    order: number;
    created_at: number;
    created_by?: User;
    updated_at: number;
    updated_by?: User;
};

export type Status = 'DRAFT' | 'UNPUBLISHED' | 'PUBLISHED';
export type StockRulesVersion = {
    id: number;
    name: string;
    status: Status;
    rules?: StockItemRule[];
    created_at: number;
    created_by?: User;
    updated_at: number;
    updated_by?: User;
    deleted_at?: number;
};
