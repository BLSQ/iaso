import { PaginationParams } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';

export type VaccineRepositoryParams = PaginationParams & {
    countries?: string;
    country_block?: string;
    file_type?: string;
    vaccine_type?: string;
};

export type DocumentData = {
    date?: string;
    file?: string;
};

export type VaccineReporting = {
    country_name: string;
    campaign_obr_name: string;
    rounds_count: string;
    start_date: string;
    vrf_data: DocumentData[];
    pre_alert_data: DocumentData[];
    form_a_data: DocumentData[];
    incident_reports: DocumentData[];
    destruction_reports: DocumentData[];
};
