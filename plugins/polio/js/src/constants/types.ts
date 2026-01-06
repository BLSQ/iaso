import { Pagination } from 'bluesquare-components';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import {
    DropdownOptionsWithOriginal,
    Nullable,
} from '../../../../../hat/assets/js/apps/Iaso/types/utils';
import { Profile } from '../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { SubActivityFormValues } from '../domains/Campaigns/SubActivities/types';

export type ObrName = string;

export type GroupedCampaign = {
    campaigns: { id: string; name: ObrName }[];
    created_at: string;
    id: number;
    name: string;
    updated_at: string;
};

export type GroupedCampaigns = Pagination & {
    results: GroupedCampaign[];
};

export type ViewPort = {
    center: number[];
    zoom: number;
};

export type CampaignStatus =
    | 'ALL'
    | 'PREPARING'
    | 'ROUND1START'
    | 'ROUND1DONE'
    | 'ROUND2START'
    | 'ROUND2DONE';

export type CampaignLogDetail = {
    content_type: string;
    created_at: string;
    id: number;
    object_id: string;
    source: string;
    user: Record<string, any>;
};

export type CampaignLogsDetail = Pagination & {
    list: CampaignLogDetail[];
};

export type CampaignLogData = {
    new_value?: Record<string, any>;
    user?: Profile;
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

export type Vaccine = 'nOPV2' | 'bOPV' | 'mOPV2' | 'nOPV2 & bOPV';
export type VaccineForStock = 'nOPV2' | 'bOPV' | 'mOPV2';

export type Virus = 'PV1' | 'PV2' | 'PV3' | 'cVDPV2' | 'WPV1';

export type DetectionStatus = 'PENDING' | 'ONGOING' | 'FINISHED';

export type DetectionResponsible =
    | 'WHO'
    | 'UNICEF'
    | 'NAT'
    | 'MOH'
    | 'PROV'
    | 'DIST';

export type RiskAssessmentStatus =
    | 'APPROVED'
    | 'TO_SUBMIT'
    | 'SUBMITTED'
    | 'REVIEWED';

export type ResponsibleLevel =
    | 'WHO'
    | 'UNICEF'
    | 'NAT'
    | 'MOH'
    | 'PROV'
    | 'DIST';

export type PreparednessSyncStatus =
    | 'QUEUED'
    | 'ONGOING'
    | 'FAILURE'
    | 'FINISHED';

export type BudgetStatusDeprecated =
    | 'APPROVED'
    | 'TO_SUBMIT'
    | 'SUBMITTED'
    | 'REVIEWED';

export type PaymentMode = 'DIRECT' | 'DFC' | 'MOBILE_PAYMENT';

export type Scope = {
    group: { name?: string; id?: number; org_units: number[] };
    vaccine?: Vaccine;
};

export type RoundVaccine = {
    doses_per_vial: Nullable<number>;
    id: number;
    name: Vaccine;
    wastage_ratio_forecast: Nullable<string>;
};

export type Shipment = {
    comment: Nullable<string>;
    date_reception: Nullable<string>;
    estimated_arrival_date: Nullable<string>;
    id: number;
    po_numbers: Nullable<number>;
    reception_pre_alert: Nullable<string>;
    vaccine_name: Vaccine;
    vials_received: Nullable<number>;
};

export type Destruction = {
    comment: Nullable<string>;
    date_report: Nullable<string>;
    date_report_received: Nullable<string>;
    id: number;
    vials_destroyed: Nullable<number>;
};

export type RoundDateHistoryEntry = {
    created_at: string; // DATE
    ended_at: string; // DATE
    previous_ended_at: string; // DATE
    previous_started_at: string; // DATE
    reason_for_delay: number; // an id
    started_at: string; // DATE
    user: { first_name: string; last_name: string; username: string };
};

export type Round = {
    awareness_of_campaign_plannning: Nullable<string>;
    campaign: Nullable<string>; // uuid
    cost: Nullable<string>;
    datelogs: RoundDateHistoryEntry[];
    date_destruction: Nullable<string>;
    date_signed_vrf_received: Nullable<string>; // date
    destructions: Destruction[];
    doses_requested: Nullable<number>;
    ended_at: string; // date
    forma_comment: Nullable<string>;
    forma_date: Nullable<string>; // date
    forma_missing_vials: Nullable<number>;
    forma_reception: Nullable<string>; // date
    forma_unusable_vials: Nullable<number>;
    forma_usable_vials: Nullable<number>;
    id: number;
    im_ended_at: Nullable<string>; // date
    im_percentage_children_missed_in_household: Nullable<string>;
    im_percentage_children_missed_in_plus_out_household: Nullable<string>;
    im_percentage_children_missed_out_household: Nullable<string>;
    im_started_at: Nullable<string>; // date
    is_planned: boolean;
    lqas_district_failing: Nullable<number>;
    lqas_district_passing: Nullable<number>;
    lqas_ended_at: Nullable<string>; // date
    lqas_started_at: Nullable<string>; // date
    main_awareness_problem: Nullable<string>;
    mop_up_ended_at: Nullable<string>; // date
    mop_up_started_at: Nullable<string>; // date
    number: number;
    on_hold: boolean;
    percentage_covered_target_population: Nullable<number>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: Nullable<PreparednessSyncStatus>;
    reporting_delays_district_to_region: Nullable<number>;
    reporting_delays_hc_to_district: Nullable<number>;
    reporting_delays_region_to_national: Nullable<number>;
    scopes: Scope[];
    started_at: string; // date
    shipments: Shipment[];
    target_population: Nullable<number>;
    vaccine_names: string;
    vaccine_names_extended: string;
    vaccines: RoundVaccine[];
    vials_destroyed: Nullable<number>;
};

type CalendarRound = {
    ended_at: string;
    id: number;
    number: number;
    scopes: Scope[];
    started_at: string;
    target_population: Nullable<number>;
    vaccine_names: string;
};

export type CalendarSubActivity = {
    end_date: string;
    id: number;
    name: string;
    round_number: number;
    scopes: Scope[];
    start_date: string;
    vaccine_names: string;
};

export type CalendarCampaign = {
    account: number;
    campaign_types: CampaignType[];
    description: string;
    epid: Nullable<string>;
    general_status: string;
    grouped_campaigns: number[];
    id: string;
    is_planned: boolean;
    is_preventive: boolean;
    is_test: boolean;
    obr_name: ObrName;
    on_hold: boolean;
    rounds: Array<CalendarRound>;
    scopes: Scope[];
    separate_scopes_per_round: boolean;
    single_vaccines: string;
    sub_activities: Array<CalendarSubActivity>;
    top_level_org_unit_id: number;
    top_level_org_unit_name: string;
    vaccines: string;
};

export type Campaign = {
    account: number;
    ag_nopv_group_met_at: Nullable<string>; // date
    budget_current_state_key: string;
    budget_current_state_label: Nullable<string>;
    budget_rrt_oprrt_approval_at: Nullable<string>; // date
    budget_status: Nullable<BudgetStatusDeprecated>;
    campaign_types: CampaignType[];
    country: Nullable<number>;
    created_at: string;
    creation_email_sent_at: Nullable<string>; // date time
    cvdpv2_notified_at: Nullable<string>; // date
    deleted_at: Nullable<string>;
    description: Nullable<string>;
    detection_first_draft_submitted_at: Nullable<string>; // date
    detection_responsible: Nullable<DetectionResponsible>;
    detection_rrt_oprrt_approval_at: Nullable<string>; // date
    detection_status: DetectionStatus;
    dg_authorized_at: Nullable<string>; // date
    district_count: Nullable<number>;
    enable_send_weekly_emails: boolean;
    epid: Nullable<string>;
    general_status: string;
    gpei_coordinator: Nullable<string>;
    gpei_email: Nullable<string>;
    grouped_campaigns: number[];
    group: Nullable<number>; // Doesn't appear nullbale in swagger but had anull value in payload
    id: string;
    initial_org_unit: Nullable<number>;
    integrated_campaigns: {
        id: string;
        obr_name: string;
        campaign_types: { name: string; id: number };
    }[];
    investigation_at: Nullable<string>; // date
    is_preventive: boolean;
    is_test: boolean;
    no_regret_fund_amount: Nullable<number>; // decimal
    obr_name: ObrName;
    on_hold: boolean;
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
    onset_at: Nullable<string>; // date
    outbreak_declaration_date: Nullable<string>; // date
    payment_mode: Nullable<PaymentMode>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: PreparednessSyncStatus;
    pv2_notified_at: Nullable<string>; // date
    pv_notified_at: Nullable<string>; // date
    risk_assessment_first_draft_submitted_at: Nullable<string>; // date
    risk_assessment_responsible: Nullable<ResponsibleLevel>;
    risk_assessment_rrt_oprrt_approval_at: Nullable<string>; // date
    risk_assessment_status: Nullable<RiskAssessmentStatus>; // could be more strict
    rounds: Round[];
    scopes: Scope[];
    separate_scopes_per_round: boolean;
    single_vaccines?: string;
    top_level_org_unit_id: number;
    top_level_org_unit_name: string;
    unicef_disbursed_to_co_at: Nullable<string>; // date
    unicef_disbursed_to_moh_at: Nullable<string>; // date
    updated_at: string;
    vaccines: string;
    verification_score: Nullable<number>;
    virus: Nullable<Virus>;
    who_disbursed_to_co_at: Nullable<string>; // date
    who_disbursed_to_moh_at: Nullable<string>; // date
};

export type MergedShapeProperties = {
    id: string;
    obr_name: ObrName;
    round_number?: number;
    scope_key: string;
    top_level_org_unit_name: string;
    vaccine: string;
};
export type MergedShape = {
    color?: string;
    geometry: {
        type: 'string';
        coordinates: number[];
    };
    properties: MergedShapeProperties;
    type: string;
};
export type MergedShapes = {
    cache_creation_date: number;
    features: MergedShape[];
    type: string;
};

export type GeoJson = {
    crs: { type: string; properties: Record<string, unknown> };
    features: {
        id: number;
        type: 'Feature'; // This should also be a specific string literal
        geometry: {
            type:
                | 'Point'
                | 'MultiPoint'
                | 'LineString'
                | 'MultiLineString'
                | 'Polygon'
                | 'MultiPolygon'
                | 'GeometryCollection'; // Specify the correct geometry type
            coordinates: Array<Array<[number, number]>>;
        };
        properties: Record<string, unknown>;
    }[];
    type: 'FeatureCollection'; // Adjusted to match the specific string literal expected by React-Leaflet
};

export type Shape = {
    altitude: Nullable<number>;
    data?: Record<string, any>;
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
    parent_name?: string;
    short_name: string;
    source_id: number;
    source_name: string;
};

export type MapColor = {
    color: string;
    opacity: string; // a number as string: "2"
    weight: string; // a number as string: "2"
    zIndex: number;
};

export type MapShapes = {
    isFetchingGeoJson: boolean;
    isFetchingRegions: boolean;
    regionShapes: OrgUnit[];
    shapes: OrgUnit[];
};

export type Side = 'left' | 'right';

export const Sides: Record<'left' | 'right', Side> = {
    left: 'left',
    right: 'right',
};

export type CampaignType = {
    id: number;
    name: string;
    slug: string;
};

type NestedRound = {
    ended_at: Nullable<string>;
    id: number;
    number: number;
    started_at: Nullable<string>;
};

export type CampaignListItem = {
    account: number;
    campaign_types: CampaignType[];
    cvdpv2_notified_at: Nullable<string>;
    epid: Nullable<string>;
    general_status: string;
    grouped_campaigns: number[];
    id: string;
    is_planned: boolean;
    is_preventive: boolean;
    is_test: boolean;
    obr_name: ObrName;
    on_hold?: boolean;
    rounds: NestedRound[];
    top_level_org_unit_id: number;
    top_level_org_unit_name: Nullable<string>;
};

export type DefaultCampaignValues = {
    budget_current_state_key: string;
    campaign_types: number[];
    description?: string;
    detection_status: string;
    enable_send_weekly_email: boolean;
    group?: { name: string; org_units: number[] };
    has_data_in_budget_tool: boolean;
    id?: string; // uuid
    initial_org_unit?: number;
    is_planned: boolean;
    is_preventive: boolean;
    is_test: boolean;
    non_field_errors?: any;
    obr_name?: ObrName;
    on_hold: boolean;
    org_unit?: Shape;
    risk_assessment_status: string;
    rounds: Round[];
    scopes: Scope[];
    separate_scopes_per_round: boolean;
    top_level_org_unit_id?: number;
};
export type PolioCampaignValues = DefaultCampaignValues & {
    ag_nopv_group_met_at?: string | null;
    approval_confirmed_at_WFEDITABLE?: string | null;
    approved_at_WFEDITABLE?: string | null;
    approved_by_unicef_at_WFEDITABLE?: string | null;
    approved_by_who_at_WFEDITABLE?: string | null;
    cvdpv2_notified_at?: string | null;
    detection_first_draft_submitted_at?: string | null;
    dg_authorized_at?: string | null;
    district_count?: number;
    epid?: string;
    feedback_sent_to_gpei_at_WFEDITABLE?: string | null;
    feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE?: string | null;
    feedback_sent_to_orpg_operations_who_at_WFEDITABLE?: string | null;
    feedback_sent_to_rrt1_at_WFEDITABLE?: string | null;
    feedback_sent_to_rrt2_at_WFEDITABLE?: string | null;
    gpei_consolidated_budgets_at_WFEDITABLE?: string | null;
    grouped_campaigns?: number[];
    integrated_campaigns: {
        id: string;
        obr_name: string;
        campaign_types: { name: string; id: number };
    }[];
    investigation_at?: string | null;
    no_regret_fund_amount?: number;
    onset_at?: string | null;
    outbreak_declaration_date?: string | null;
    re_submitted_to_orpg_operations1_at_WFEDITABLE?: string | null;
    re_submitted_to_orpg_operations2_at_WFEDITABLE?: string | null;
    re_submitted_to_rrt_at_WFEDITABLE?: string | null;
    risk_assessment_first_draft_submitted_at?: string | null;
    risk_assessment_rrt_oprtt_approval_at?: string | null;
    spreadsheet_url?: string | null;
    subactivity?: SubActivityFormValues; // The subactivity is not part of the campaign API payload, but saved in formik and posted through the subactivities API
    submitted_for_approval_at_WFEDITABLE?: string | null;
    submitted_to_orpg_operations1_at_WFEDITABLE?: string | null;
    submitted_to_orpg_wider_at_WFEDITABLE?: string | null;
    submitted_to_rrt_at_WFEDITABLE?: string | null;
    submission_to_orpg_operations_2_at_WFEDITABLE?: string | null;
    unicef_disbursed_to_co_at?: string | null;
    unicef_disbursed_to_moh_at?: string | null;
    verification_score?: number;
    virus?: string;
    vaccines?: string;
    who_disbursed_to_co_at?: string | null;
    who_disbursed_to_moh_at?: string | null;
    who_sent_budget_at_WFEDITABLE?: string | null;
};

export type CampaignFormValues = DefaultCampaignValues | PolioCampaignValues;

export type CampaignTypesDropdown = DropdownOptionsWithOriginal<
    string,
    CampaignType
>;

/** UUID as string */
export type UuidAsString = string;
/**
 * YYYY-MM-dd
 */
export type DateAsString = string;
/**
 * MM-YYYY e.g 12-2024
 */
export type MonthYear = string;
/**
 * number as string e.g. "5"
 */
export type NumberAsString = string;

export type PreparednessIndicator = {
    communication_c4d: number;
    communication_sm_activities: number;
    communication_sm_fund: number;
    operational_fund: number;
    penmarkers_supply: number;
    sia_micro_planning: number;
    sia_training: number;
    status_score: number;
    vaccine_and_droppers_received: number;
    vaccine_cold_chain_assessment: number;
    vaccine_monitors_training_and_deployment: number;
};

export type PreparednessScores = {
    adverse_score: number;
    advocacy_score: number;
    monitoring_score: number;
    planning_score: number;
    security_score: number | null;
    status_score: number;
    training_score: number;
    vaccine_score: number;
};

export type RegionName = string;
export type DistrictName = string;

export type RefreshPreparednessResponse = {
    created_at: string;
    district_score: number;
    districts: {
        [key: DistrictName]: PreparednessScores &
            PreparednessIndicator & { region: string };
    };
    format: string;
    indicators: {
        [key: string]: {
            districts: number;
            key: string;
            national: number;
            regions: number;
            sn: number;
            title: string;
        };
    };
    national: PreparednessIndicator & { round: string };
    national_score: number;
    overall_status_score: number;
    regions: {
        [key: RegionName]: PreparednessIndicator;
    };
    regional_score: number;
    title: string;
    totals: {
        district_score: number;
        national_score: number;
        regional_score: number;
    };
};
