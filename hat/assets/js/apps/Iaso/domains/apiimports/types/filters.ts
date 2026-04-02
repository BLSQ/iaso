export type Filters = {
    createdBy?: string;
    importType?: string;
    hasProblem?: boolean;
    appId?: string;
    appVersion?: string;
};

export type Params = Filters & {
    order: string;
    page: string;
    pageSize: string;
    tab: string;
};
