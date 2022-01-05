/* eslint-disable camelcase */
export type FormatForNFMArgs = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: RoundString;
    formatMessage: IntlFormatMessage;
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

export type BarChartData = {
    name:string,
    value:number
}

export type IntlMessage = {
    id:string,
    defaultMessage:string,
    values?:Record<string,any>
}

export type LqasImCampaign = {
    round_1: Record<string, LqasImCampaignData>;
    round_2: Record<string, LqasImCampaignData>;
    round_1_nfm_stats: Record<string, number>;
    round_2_nfm_stats: Record<string, number>;
    districts_not_found: string[];
    country_id: number;
    country_name?: string;
};


export type LqasImCampaignData = {
    total_child_fmd: number;
    total_child_checked: number;
    care_giver_stats: Record<string, number>;
    district?: number;
};

export type LqasImCampaignDataWithNameAndRegion = LqasImCampaignData & {
    name: string;
    region: string | null;
};
export type ConvertedLqasImData = {
    round_1: LqasImCampaignDataWithNameAndRegion[];
    round_2: LqasImCampaignDataWithNameAndRegion[];
};

export type IntlFormatMessage = (message:IntlMessage)=>string