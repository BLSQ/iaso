export type SyncResponse = {
    id: number;
    name: string;
    account: {
        id: number;
        name: string;
        default_version: number;
    };
    count_create: number;
    count_update: number;
    created_at: string;
    created_by: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        full_name: string;
    };
    source_version_to_compare_with: {
        data_source: number;
        data_source_name: string;
        description: string;
        id: number;
        number: number;
    };
    source_version_to_update: {
        data_source: number;
        data_source_name: string;
        description: string;
        id: number;
        number: number;
    };
    updated_at: string;
};
