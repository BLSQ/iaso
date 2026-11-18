/** Body of POST /api/dhis2ouimporter/, matching Dhis2OuImporterSerializer. */
export type Dhis2OuImporterRequest = {
    source_id: number;
    source_version_number?: number | null;
    dhis2_url?: string;
    dhis2_login?: string;
    dhis2_password?: string;
    force?: boolean;
    validate_status?: boolean;
    continue_on_error?: boolean;
    description?: string | null;
};
