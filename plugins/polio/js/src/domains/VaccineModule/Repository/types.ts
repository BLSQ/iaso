import { PaginationParams } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Vaccine } from '../../../constants/types';

export type VaccineRepositoryParams = PaginationParams & {
    countries?: string;
    campaignType?: string;
    country_block?: string;
    campaignGroups?: string;
    file_type?: string;
    vaccine_name?: Vaccine;
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
