import { IntlMessage } from '../../../../../hat/assets/js/apps/Iaso/types/intl';
import { Pagination } from '../../../../../hat/assets/js/apps/Iaso/types/table';
import { Nullable } from '../../../../../hat/assets/js/apps/Iaso/types/utils';

/* eslint-disable camelcase */
export type FormatForNFMArgs<T> = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: number;
    formatMessage: IntlFormatMessage;
    type: T;
};
export type LqasImData = {
    stats: Record<string, LqasImCampaign>;
    form_count: number;
    form_campaign_not_found_count: number;
    day_country_not_found: Record<string, Record<string, number>>;
};

export type BarChartData = {
    name: string;
    value: number; // value as percentage
    absValue: number; // absolute number
};
export type LqasImRound = {
    number: number;
    data: Record<string, LqasImDistrictData>;
    nfm_stats: Record<string, number>;
    nfm_abs_stats: Record<string, number>;
};
export type LqasImCampaign = {
    rounds: LqasImRound[];
    districts_not_found: string[];
    country_id: number;
    country_name?: string;
    has_scope: boolean;
};

export type LqasImDistrictData = {
    total_child_fmd: number;
    total_child_checked: number;
    care_giver_stats?: Record<string, number>;
    district?: number;
    total_sites_visited: number;
    region_name?: string;
};

export type LqasImDistrictDataWithNameAndRegion = LqasImDistrictData & {
    name: string;
    region_name: Nullable<string>;
};
export type ConvertedLqasImData = {
    rounds: { number: number; data: LqasImDistrictDataWithNameAndRegion[] }[];
};

// eslint-disable-next-line no-unused-vars
export type IntlFormatMessage = (message: IntlMessage) => string;

export type LqasIMtype = 'imGlobal' | 'imIHH' | 'imOHH' | 'lqas';

export type LqasImMapLegendData = {
    reportingDistricts: number;
    total_child_checked: number;
    total_child_fmd?: number;
    total_sites_visited: number;
    ratioUnvaccinated?: string;
};

export type LqasImParams = {
    type: LqasIMtype;
    data?: Record<string, ConvertedLqasImData>;
    campaign?: string;
    round: number;
};

export type GroupedCampaign = {
    id: number;
    created_at: string;
    updated_at: string;
    name: string;
    campaigns: { id: string; name: string }[];
};

export type GroupedCampaigns = Pagination & {
    results: GroupedCampaign[];
};

export type ViewPort = {
    zoom: number;
    center: number[];
};

export type CampaignStatus =
    | 'ALL'
    | 'PREPARING'
    | 'ROUND1START'
    | 'ROUND1DONE'
    | 'ROUND2START'
    | 'ROUND2DONE';

export type BudgetStatus =
    | 'all'
    | 'validated'
    | 'validation_ongoing'
    | 'noBudgetSubmitted';

export type BudgetEventType =
    | 'submission'
    | 'validation'
    | 'comments'
    | 'request'
    | 'transmission'
    | 'feedback'
    | 'review';

export type BudgetEvent = {
    id: number;
    campaign: string;
    author: number;
    type: BudgetEventType;
    status: BudgetStatus;
    created_at: string;
    updated_at: string;
    deleted_at: Nullable<string>;
    // legacy. should be deleted backend side
    cc_emails: null;
    comment: Nullable<string>;
    links: Nullable<string>;
    is_finalized: boolean;
    is_email_sent: boolean;
    target_teams: number[];
    files: any;
    internal: boolean;
};
