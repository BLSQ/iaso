export type User = {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
};

export type APIImport = {
    created_at: number;
    user?: User;
    import_type?: string;
    json_body?: object;
    headers?: object;
    has_problem: boolean;
    file?: string;
    app_id: string;
    app_version: string;
};
