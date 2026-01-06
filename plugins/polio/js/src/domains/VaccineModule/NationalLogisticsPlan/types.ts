export type NationalLogisticsPlanData = {
    id: number;
    date: string;
    status: string;
    country_name: string;
    country_id: number;
    vaccine: string;
    account: number;
    created_at: string;
    created_by: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    };
    updated_at: string;
    updated_by: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    };
};

export type NationalLogisticsPlanList = {
    results: NationalLogisticsPlanData[];
    count: number;
    pages: number;
    has_next: boolean;
    has_previous: boolean;
};
