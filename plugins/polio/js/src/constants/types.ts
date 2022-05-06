import { IntlMessage } from '../../../../../hat/assets/js/apps/Iaso/types/intl';
import { Pagination } from '../../../../../hat/assets/js/apps/Iaso/types/table';

/* eslint-disable camelcase */
export type FormatForNFMArgs<T> = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: RoundString;
    formatMessage: IntlFormatMessage;
    type: T
};
export type LqasImData = {
    stats: Record<string, LqasImCampaign>;
    form_count: number;
    form_campaign_not_found_count: number;
    day_country_not_found: Record<string, Record<string, number>>;
};

export type RoundString = 'round_1' | 'round_2';

export enum NfmRoundString {
    'round_1' = 'round_1_nfm_stats',
    'round_2' = 'round_2_nfm_stats',
}

export enum RfaRoundString {
    'round_1' = 'round_1_nfm_abs_stats',
    'round_2' = 'round_2_nfm_abs_stats',
}

export type BarChartData = {
    name:string,
    value:number, // value as percentage
    absValue:number // absolute number
}

export type LqasImCampaign = {
    round_1: Record<string, LqasImCampaignData>;
    round_2: Record<string, LqasImCampaignData>;
    round_1_nfm_stats: Record<string, number>;
    round_2_nfm_stats: Record<string, number>;
    districts_not_found: string[];
    country_id: number;
    country_name?: string;
    has_scope:boolean
};


export type LqasImCampaignData = {
    total_child_fmd: number;
    total_child_checked: number;
    care_giver_stats: Record<string, number>;
    district?: number;
    total_sites_visited:number;
};

export type LqasImCampaignDataWithNameAndRegion = LqasImCampaignData & {
    name: string;
    region_name: string | null;
};
export type ConvertedLqasImData = {
    round_1: LqasImCampaignDataWithNameAndRegion[];
    round_2: LqasImCampaignDataWithNameAndRegion[];
};

export type IntlFormatMessage = (message:IntlMessage)=>string

export type LqasIMtype = 'imGlobal'|'imIHH'|'imOHH'|'lqas'

export type LqasImMapLegendData = {
    reportingDistricts: number,
    total_child_checked: number,
    total_child_fmd?: number,
    total_sites_visited: number,
    ratioUnvaccinated?:string
}

export type LqasImParams = {
    type: LqasIMtype;
    data?: Record<string, ConvertedLqasImData>;
    campaign?: string;
    round: RoundString;
}

export type GroupedCampaign =  {
    id: number,
    created_at: string,
    updated_at: string,
    name: string,
    campaigns: {id:string, name:string}[]
}

export type GroupedCampaigns = Pagination & {
    results:GroupedCampaign[]
}

export type ViewPort = {
    zoom: number;
    center: number[];
};