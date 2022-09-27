export type Filters = {
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    submitterId?: string;
    submitterTeamId?: string;
    entityTypeIds?: string;
};

export type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    submitterId?: string;
    submitterTeamId?: string;
    entityTypeIds?: string;
};
