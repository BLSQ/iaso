export type Filters = {
    dateFrom?: string;
    dateTo?: string;
    entityTypeIds?: string;
    fieldsSearch?: string;
    location?: string;
    locationLimit?: string;
    search?: string;
    submitterId?: string;
    submitterTeamId?: string;
};

export type Params = Filters & {
    order: string;
    page: string;
    pageSize: string;
    tab: string;
};
