export type ApiFormStatsParams = {
    params: FormStatsParams;
    url: string;
    queryKey: string[];
};

export type FormStatsParams = { accountId: string; projectIds?: string };
