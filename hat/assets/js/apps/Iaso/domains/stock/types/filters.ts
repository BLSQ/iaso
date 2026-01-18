export type Filters = {
    created_by: string;
    search?: string;
    projectsIds?: string;
    orgUnitTypeIds?: string;
};

export type Params = Filters & {
    order: string;
    page: string;
    pageSize: string;
    tab: string;
};
