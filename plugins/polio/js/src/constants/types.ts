import { IntlMessage } from '../../../../../hat/assets/js/apps/Iaso/types/intl';
import { Pagination } from '../../../../../hat/assets/js/apps/Iaso/types/table';
import { Nullable } from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Profile } from '../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

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
    amount?: number;
};

export type CampaignLogDetail = {
    id: number;
    content_type: string;
    object_id: string;
    source: string;
    user: Record<string, any>;
    created_at: string;
};

export type CampaignLogsDetail = Pagination & {
    list: CampaignLogDetail[];
};

export type CampaignLogData = {
    user: Profile;
    new_value: Record<string, any>;
};

export type CampaignFieldType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'string'
    | 'undefined'
    | 'function'
    | 'symbol'
    | 'integer'
    | 'bigint'
    | 'decimal'
    | 'range'
    | 'text'
    | 'select_one'
    | 'select_multiple'
    | 'select_one_from_file'
    | 'select_multiple_from_file'
    | 'rank'
    | 'note'
    | 'geopoint'
    | 'geotrace'
    | 'geoshape'
    | 'date'
    | 'time'
    | 'dateTime'
    | 'start'
    | 'end'
    | 'image'
    | 'audio'
    | 'background-audio'
    | 'video'
    | 'file'
    | 'barcode'
    | 'calculate'
    | 'acknowledge'
    | 'hidden'
    | 'xml-external';

export type Translations = {
    messages: Record<
        string,
        { id: string; defaultMessage: string; values?: string }
    >;
};

export type Scope = {
    vaccine: string;
    group: { name: string; id: number; org_units: number[] };
};

export type RoundVaccine = {
    wastage_ratio_forecast: string;
    doses_per_vial: number;
    name: string;
    id: number;
};

export type Shipment = {
    id: number;
    po_numbers: number;
    vials_received: number;
    estimated_arrival_date: string;
    vaccine_name: string;
    date_reception: string;
    reception_pre_alert: string;
    comment: Nullable<string>;
};

export type Destruction = {
    id: number;
    vials_destroyed: number;
    date_report: string;
    date_report_received: string;
    comment: Nullable<string>;
};

export type Round = {
    id: string;
    started_at: string;
    ended_at: string;
    mop_up_started_at: Nullable<string>;
    mop_up_ended_at: Nullable<string>;
    im_started_at: Nullable<string>;
    im_ended_at: Nullable<string>;
    lqas_started_at: Nullable<string>;
    lqas_ended_at: Nullable<string>;
    target_population: Nullable<number>;
    doses_requested: Nullable<number>;
    cost: string;
    im_percentage_children_missed_in_household: Nullable<number>;
    im_percentage_children_missed_out_household: Nullable<number>;
    im_percentage_children_missed_in_plus_out_household: Nullable<number>;
    awareness_of_campaign_plannning: Nullable<number>;
    main_awareness_problem: Nullable<string>;
    lqas_districts_passing: Nullable<number>;
    lqas_districts_failing: Nullable<number>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: Nullable<string>;
    scopes: Scope[];
    vaccines: RoundVaccine[];
    shipments: Shipment[];
    destructions: Destruction[];
    number: number;
    date_signed_vrf_received: Nullable<string>;
    date_destruction: Nullable<string>;
    vials_destroyed: Nullable<number>;
    reporting_delays_hc_to_district: Nullable<number>;
    reporting_delays_district_to_region: Nullable<number>;
    reporting_delays_region_to_national: Nullable<number>;
    forma_reception: Nullable<string>;
    forma_date: Nullable<string>;
    forma_comment: Nullable<string>;
    forma_missing_vials: Nullable<number>;
    forma_unusable_vials: Nullable<number>;
    forma_usable_vials: Nullable<number>;
    campaign: string;
};

export type Campaign = {
    id: string;
    created_at: string;
    updated_at: string;
    round_one?: any[];
    round_two?: any[];
    rounds: Round[];
    org_unit: {
        id: number;
        name: string;
        root: {
            id: number;
            name: string;
        };
        country_parent: {
            id: number;
            name: string;
        };
    };
    top_level_org_unit_name: string;
    top_level_org_unit_id: number;
    general_status: string;
    grouped_campaigns: number[];
    account: number;
    // Maybe vaccine name can be typed more strictly
    scopes: Scope[];
    last_surge: Nullable<string | number>;
    obr_name: string;
    vaccines: string;
    deleted_at: Nullable<string | number>;
    epid: Nullable<string>;
    gpei_coordinator: Nullable<string>;
    gpei_email: Nullable<string>;
    description: Nullable<string>;
    separate_scopes_per_round: boolean;
    creation_email_sent_at: Nullable<string | number>;
    onset_at: Nullable<string | number>;
    three_level_call_at: Nullable<string | number>;
    cvdpv_notified_at: Nullable<string | number>;
    cvdpv2_notified_at: Nullable<string | number>;
    pv_notified_at: Nullable<string | number>;
    pv2_notified_at: Nullable<string | number>;
    virus: Nullable<string>;
    vacine: Nullable<string>;
    detection_status: string; // could be more strict
    detection_responsible: Nullable<string>;
    detection_first_draft_submitted_at: Nullable<string | number>;
    detection_rrt_oprrt_approval_at: Nullable<string | number>;
    risk_assessment_status: string; // could be more strict
    risk_assessment_responsible: Nullable<string>;
    risk_assessment_first_draft_submitted_at: Nullable<string | number>;
    risk_assessment_rrt_oprrt_approval_at: Nullable<string | number>;
    investigation_at: Nullable<string | number>;
    ag_nopv_group_met_at: Nullable<string | number>;
    dg_authorized_at: Nullable<string | number>;
    verification_score: Nullable<string | number>;
    doses_requested: Nullable<number>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: Nullable<string>;
    surge_spreadsheet_url: Nullable<string>;
    country_name_in_surge_spreadsheet: Nullable<string>;
    budget_status: Nullable<string>;
    budget_responsible: Nullable<string>;
    is_test: boolean;
    budget_current_state_key: string;
    budget_current_state_label: Nullable<string>;
    who_disbursed_to_co_at: Nullable<string | number>;
    who_disbursed_to_moh_at: Nullable<string | number>;
    unicef_disbursed_to_co_at: Nullable<string | number>;
    unicef_disbursed_to_moh_at: Nullable<string | number>;
    eomg: Nullable<unknown>;
    no_regret_fund_amount: Nullable<number>;
    payment_mode: Nullable<unknown>;
    district_count: Nullable<number>;
    budget_rrt_oprrt_approval_at: Nullable<string | number>;
    budget_submitted_at: Nullable<string | number>;
    is_preventive: boolean;
    enable_send_weekly_emails: boolean;
    initial_org_unit: number;
    country: number;
    group: Nullable<unknown>;
    last_budget_event: Nullable<unknown>;
};

export type MergedShapeProperties = {
    obr_name: string;
    id: string;
    vaccine: string;
    scope_key: string;
    top_level_org_unit_name: string;
    round_number?: number;
};
export type MergedShape = {
    type: string;
    properties: MergedShapeProperties;
    geometry: {
        type: 'string';
        coordinates: number[];
    };
    color?: string;
};
export type MergedShapes = {
    type: string;
    features: MergedShape[];
    cache_creation_date: number;
};

export type GeoJson = {
    type: string;
    features: {
        id: number;
        type: string;
        geometry: {
            type: string;
            coordinates: Array<Array<[number, number]>>;
        };
        properties: Record<string, unknown>;
    }[];
    crs: { type: string; properties: Record<string, unknown> };
};

export type Shape = {
    altitude: Nullable<number>;
    geo_json;
    has_geo_json: boolean;
    id: number;
    latitude: Nullable<number>;
    longitude: Nullable<number>;
    name: string;
    org_unit_type: string;
    org_unit_type_depth: number;
    org_unit_type_id: number;
    parent_id: number;
    parent_name: Nullable<string>;
    short_name: string;
    source_id: number;
    source_name: string;
};
