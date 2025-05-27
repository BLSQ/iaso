import { IntlFormatMessage } from 'bluesquare-components';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { ParamsWithAccountId } from 'Iaso/routing/hooks/useParamsObject';
import { Nullable } from 'Iaso/types/utils';

export type IMType = 'imGlobal' | 'imIHH' | 'imOHH';

export type LqasIMType = IMType | 'lqas';

export type IMDistrictStatus = '1imOK' | '2imWarning' | '3imFail';

export type LQASDistrictStatus =
    | '1lqasOK'
    | '3lqasverypoor'
    | '3lqaspoor'
    | '3lqasmoderate'
    | '2lqasDisqualified'
    | '3lqasundersampled'
    | '3lqasoversampled'
    | 'inScope';

// Stuff coming from the API
export type LqasImData = {
    stats: Record<string, LqasImCampaign>;
    form_count: number;
    form_campaign_not_found_count: number;
    day_country_not_found: Record<string, Record<string, number>>;
};

export type LqasImCampaign = {
    rounds: LqasImRound[];
    districts_not_found: string[];
    country_id: number;
    country_name?: string;
    has_scope: boolean;
    bad_round_number?: number;
};

export type LqasImRound = {
    number: number;
    data: Record<string, LqasImDistrictData>;
    nfm_stats: Record<string, number>;
    nfm_abs_stats: Record<string, number>;
};

export type LqasImDistrictData = {
    total_child_fmd: number;
    total_child_checked: number;
    care_giver_stats?: Record<string, number>;
    district?: number;
    total_sites_visited: number;
    region_name?: string;
    status: LQASDistrictStatus;
};

// API response reformatted for easier use
export type ConvertedLqasImData = {
    rounds: { number: number; data: LqasImDistrictDataWithNameAndRegion[] }[];
};

export type LqasImDistrictDataWithNameAndRegion = LqasImDistrictData & {
    name: string;
    region_name: Nullable<string>;
};

// Stuff in the URL
export type LqasImUrlParams = LqasImFilterParams & ParamsWithAccountId;

export type LqasImFilterParams = {
    campaign: string | undefined;
    country: string | undefined;
    rounds: string | undefined;
};

export type LqasTabValue = 'map' | 'list';

// This one should probably be renamed
export type LqasImParams = {
    type: LqasIMType;
    data?: Record<string, ConvertedLqasImData>;
    campaign?: string;
    round?: number;
};

// Charts stuff
export type FormatForNFMArgs<T> = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: number | undefined;
    formatMessage: IntlFormatMessage;
    type: T;
};

export type BarChartData = {
    name: string;
    value: number; // value as percentage
    absValue: number; // absolute number
};

export type ChartDataEntry = {
    chartKey: string;
    data: BarChartData[];
    title: string;
};
export type ChartData = {
    nfm: [ChartDataEntry, ChartDataEntry];
    rfa: [ChartDataEntry, ChartDataEntry];
    cg: [
        {
            chartKey: 'rfaLeft';
            round: number | undefined;
        },
        {
            chartKey: 'rfaRight';
            round: number | undefined;
        },
    ];
};

export type LqasDataForChart = {
    name: string;
    value: number;
    found: number;
    passing: number;
};
export type ImDataForChart = {
    name: string;
    value: number;
    marked: number;
    checked: number;
};

export type LqasImDebugData = Record<
    string,
    { hasScope: boolean; districtsNotFound: string[] }
>;
// Map stuff
export type LqasImMapLegendData = {
    reportingDistricts: number;
    total_child_checked: number;
    total_child_fmd?: number;
    total_sites_visited: number;
    ratioUnvaccinated?: string;
};

export type LqasImLegendItem = {
    label: string;
    value: string;
    color?: string;
    background?: string;
};

export type MapColorConfig = {
    color: string; // hex code
    weight: string; // number as string
    opacity: string; // number as string
    fillColor: string; // hex or hashpattern
    fillOpacity?: number;
    zIndex: number;
};

export type LqasImMapLayer = OrgUnit & {
    data: LqasImDistrictDataWithNameAndRegion | null;
    status: LQASDistrictStatus | IMDistrictStatus;
};

export type LqasImRefDate = {
    date: string;
    isDefault: boolean;
};
