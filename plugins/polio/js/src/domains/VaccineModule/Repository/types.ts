import { PaginationParams } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Vaccine } from '../../../constants/types';

export type ReportParams = {
    reportCountries?: string;
    reportCountryBlock?: string;
    reportFileType?: string;
    reportVaccineName?: string;
    reportPageSize?: string;
    reportOrder?: string;
    reportPage?: string;
};

export type FormsParams = {
    countries?: string;
    campaignType?: string;
    country_block?: string;
    campaignGroups?: string;
    file_type?: string;
    vaccine_name?: Vaccine;
};

export type VaccineRepositoryParams = PaginationParams &
    ReportParams &
    FormsParams & {
        tab?: string;
        accountId?: string;
    };

export type DocumentData = {
    date?: string;
    file?: string;
};

export type VaccineRepositoryForms = {
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

export type VaccineRepositoryReports = {
    country_name: string;
    vaccine: string;
    incident_report_data: DocumentData[];
    destruction_report_data: DocumentData[];
};
