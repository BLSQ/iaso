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
    id: number;
    created_at: string;
    updated_at: string;
    name: string;
    campaigns: { id: string; name: ObrName }[];
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
    user?: Profile;
    new_value?: Record<string, any>;
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
    vaccine?: Vaccine;
    group: { name?: string; id?: number; org_units: number[] };
};

export type RoundVaccine = {
    wastage_ratio_forecast: Nullable<string>;
    doses_per_vial: Nullable<number>;
    name: Vaccine;
    id: number;
};

export type Shipment = {
    id: number;
    po_numbers: Nullable<number>;
    vials_received: Nullable<number>;
    estimated_arrival_date: Nullable<string>;
    vaccine_name: Vaccine;
    date_reception: Nullable<string>;
    reception_pre_alert: Nullable<string>;
    comment: Nullable<string>;
};

export type Destruction = {
    id: number;
    vials_destroyed: Nullable<number>;
    date_report: Nullable<string>;
    date_report_received: Nullable<string>;
    comment: Nullable<string>;
};

export type RoundDateHistoryEntry = {
    previous_started_at: string; // DATE
    previous_ended_at: string; // DATE
    started_at: string; // DATE
    ended_at: string; // DATE
    reason_for_delay: number; // an id
    user: { first_name: string; last_name: string; username: string };
    created_at: string; // DATE
};

export type Round = {
    id: number;
    vaccine_names_extended: string;
    started_at: string; // date
    ended_at: string; // date
    mop_up_started_at: Nullable<string>; // date
    mop_up_ended_at: Nullable<string>; // date
    im_started_at: Nullable<string>; // date
    im_ended_at: Nullable<string>; // date
    lqas_started_at: Nullable<string>; // date
    lqas_ended_at: Nullable<string>; // date
    target_population: Nullable<number>;
    doses_requested: Nullable<number>;
    cost: Nullable<string>;
    vaccine_names: string;
    im_percentage_children_missed_in_household: Nullable<string>;
    im_percentage_children_missed_out_household: Nullable<string>;
    im_percentage_children_missed_in_plus_out_household: Nullable<string>;
    awareness_of_campaign_plannning: Nullable<string>;
    main_awareness_problem: Nullable<string>;
    lqas_district_passing: Nullable<number>;
    lqas_district_failing: Nullable<number>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: Nullable<PreparednessSyncStatus>;
    scopes: Scope[];
    vaccines: RoundVaccine[];
    shipments: Shipment[];
    destructions: Destruction[];
    number: number;
    date_signed_vrf_received: Nullable<string>; // date
    date_destruction: Nullable<string>;
    vials_destroyed: Nullable<number>;
    reporting_delays_hc_to_district: Nullable<number>;
    reporting_delays_district_to_region: Nullable<number>;
    reporting_delays_region_to_national: Nullable<number>;
    forma_reception: Nullable<string>; // date
    forma_date: Nullable<string>; // date
    forma_comment: Nullable<string>;
    forma_missing_vials: Nullable<number>;
    forma_unusable_vials: Nullable<number>;
    forma_usable_vials: Nullable<number>;
    campaign: Nullable<string>; // uuid
    percentage_covered_target_population: Nullable<number>;
    datelogs: RoundDateHistoryEntry[];
    on_hold: boolean;
    is_planned: boolean;
};

type CalendarRound = {
    id: number;
    number: number;
    started_at: string;
    ended_at: string;
    vaccine_names: string;
    target_population: Nullable<number>;
    scopes: Scope[];
};

export type CalendarSubActivity = {
    id: number;
    name: string;
    scopes: Scope[];
    start_date: string;
    end_date: string;
    vaccine_names: string;
    round_number: number;
};

export type CalendarCampaign = {
    id: string;
    epid: Nullable<string>;
    scopes: Scope[];
    obr_name: ObrName;
    vaccines: string;
    account: number;
    top_level_org_unit_name: string;
    top_level_org_unit_id: number;
    rounds: Array<CalendarRound>;
    sub_activities: Array<CalendarSubActivity>;
    is_preventive: boolean;
    general_status: string;
    grouped_campaigns: number[];
    separate_scopes_per_round: boolean;

    single_vaccines: string;
    campaign_types: CampaignType[];
    description: string;
    is_test: boolean;
    on_hold: boolean;
    is_planned: boolean;
};

export type Campaign = {
    id: string;
    created_at: string;
    updated_at: string;
    deleted_at: Nullable<string>;
    single_vaccines?: string;
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
    obr_name: ObrName;
    vaccines: string;
    epid: Nullable<string>;
    gpei_coordinator: Nullable<string>;
    gpei_email: Nullable<string>;
    description: Nullable<string>;
    separate_scopes_per_round: boolean;
    creation_email_sent_at: Nullable<string>; // date time
    onset_at: Nullable<string>; // date
    outbreak_declaration_date: Nullable<string>; // date
    cvdpv2_notified_at: Nullable<string>; // date
    pv_notified_at: Nullable<string>; // date
    pv2_notified_at: Nullable<string>; // date
    virus: Nullable<Virus>;
    detection_status: DetectionStatus;
    detection_responsible: Nullable<DetectionResponsible>;
    detection_first_draft_submitted_at: Nullable<string>; // date
    detection_rrt_oprrt_approval_at: Nullable<string>; // date
    risk_assessment_status: Nullable<RiskAssessmentStatus>; // could be more strict
    risk_assessment_responsible: Nullable<ResponsibleLevel>;
    risk_assessment_first_draft_submitted_at: Nullable<string>; // date
    risk_assessment_rrt_oprrt_approval_at: Nullable<string>; // date
    investigation_at: Nullable<string>; // date
    ag_nopv_group_met_at: Nullable<string>; // date
    dg_authorized_at: Nullable<string>; // date
    verification_score: Nullable<number>;
    preparedness_spreadsheet_url: Nullable<string>;
    preparedness_sync_status: PreparednessSyncStatus;
    budget_status: Nullable<BudgetStatusDeprecated>;
    is_test: boolean;
    on_hold: boolean;
    budget_current_state_key: string;
    budget_current_state_label: Nullable<string>;
    who_disbursed_to_co_at: Nullable<string>; // date
    who_disbursed_to_moh_at: Nullable<string>; // date
    unicef_disbursed_to_co_at: Nullable<string>; // date
    unicef_disbursed_to_moh_at: Nullable<string>; // date
    no_regret_fund_amount: Nullable<number>; // decimal
    payment_mode: Nullable<PaymentMode>;
    district_count: Nullable<number>;
    budget_rrt_oprrt_approval_at: Nullable<string>; // date
    is_preventive: boolean;
    enable_send_weekly_emails: boolean;
    initial_org_unit: Nullable<number>;
    country: Nullable<number>;
    group: Nullable<number>; // Doesn't appear nullbale in swagger but had anull value in payload
    campaign_types: CampaignType[];
};

export type MergedShapeProperties = {
    obr_name: ObrName;
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
    type: 'FeatureCollection'; // Adjusted to match the specific string literal expected by React-Leaflet
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
    parent_name?: string;
    short_name: string;
    source_id: number;
    source_name: string;
    data?: Record<string, any>;
};

export type MapColor = {
    color: string;
    weight: string; // a number as string: "2"
    opacity: string; // a number as string: "2"
    zIndex: number;
};

export type MapShapes = {
    shapes: OrgUnit[];
    isFetchingGeoJson: boolean;
    regionShapes: OrgUnit[];
    isFetchingRegions: boolean;
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
    id: number;
    number: number;
    started_at: Nullable<string>;
    ended_at: Nullable<string>;
};

export type CampaignListItem = {
    id: string;
    epid: Nullable<string>;
    obr_name: ObrName;
    account: number;
    cvdpv2_notified_at: Nullable<string>;
    top_level_org_unit_name: Nullable<string>;
    top_level_org_unit_id: number;
    rounds: NestedRound[];
    general_status: string;
    grouped_campaigns: number[];
    campaign_types: CampaignType[];
    is_test: boolean;
    on_hold?: boolean;
    is_preventive: boolean;
    is_planned: boolean;
};

export type DefaultCampaignValues = {
    id?: string; // uuid
    initial_org_unit?: number;
    top_level_org_unit_id?: number;
    campaign_types: number[];
    obr_name?: ObrName;
    description?: string;
    gpei_coordinator?: string;
    is_preventive: boolean;
    is_test: boolean;
    on_hold: boolean;
    is_planned: boolean;
    rounds: Round[];
    scopes: Scope[];
    org_unit?: Shape;
    separate_scopes_per_round: boolean;
    group?: { name: string; org_units: number[] };
    enable_send_weekly_email: boolean;
    has_data_in_budget_tool: boolean;
    budget_current_state_key: string;
    detection_status: string;
    risk_assessment_status: string;
    non_field_errors?: any;
};
export type PolioCampaignValues = DefaultCampaignValues & {
    subactivity?: SubActivityFormValues; // The subactivity is not part of the campaign API payload, but saved in formik and posted through the subactivities API
    virus?: string;
    vaccines?: string;
    epid?: string;
    grouped_campaigns?: number[];
    onset_at?: string | null;
    cvdpv2_notified_at?: string | null;
    outbreak_declaration_date?: string | null;
    detection_first_draft_submitted_at?: string | null;
    investigation_at?: string | null;
    risk_assessment_first_draft_submitted_at?: string | null;
    risk_assessment_rrt_oprtt_approval_at?: string | null;
    ag_nopv_group_met_at?: string | null;
    dg_authorized_at?: string | null;
    // Budget-related dates
    who_sent_budget_at_WFEDITABLE?: string | null;
    unicef_sent_budget_at_WFEDITABLE?: string | null;
    gpei_consolidated_budgets_at_WFEDITABLE?: string | null;
    submitted_to_rrt_at_WFEDITABLE?: string | null;
    feedback_sent_to_gpei_at_WFEDITABLE?: string | null;
    re_submitted_to_rrt_at_WFEDITABLE?: string | null;
    submitted_to_orpg_operations1_at_WFEDITABLE?: string | null;
    feedback_sent_to_rrt1_at_WFEDITABLE?: string | null;
    submitted_to_orpg_wider_at_WFEDITABLE?: string | null;
    submission_to_orpg_operations_2_at_WFEDITABLE?: string | null;
    feedback_sent_to_rrt2_at_WFEDITABLE?: string | null;
    re_submitted_to_orpg_operations1_at_WFEDITABLE?: string | null;
    re_submitted_to_orpg_operations2_at_WFEDITABLE?: string | null;
    submitted_for_approval_at_WFEDITABLE?: string | null;
    approved_by_who_at_WFEDITABLE?: string | null;
    feedback_sent_to_orpg_operations_who_at_WFEDITABLE?: string | null;
    feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE?: string | null;
    approved_by_unicef_at_WFEDITABLE?: string | null;
    approved_at_WFEDITABLE?: string | null;
    approval_confirmed_at_WFEDITABLE?: string | null;
    unicef_disbursed_to_moh_at?: string | null;
    unicef_disbursed_to_co_at?: string | null;
    who_disbursed_to_moh_at?: string | null;
    who_disbursed_to_co_at?: string | null;
    spreadsheet_url?: string | null;
    district_count?: number;
    no_regret_fund_amount?: number;
    verification_score?: number;
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
    operational_fund: number;
    vaccine_and_droppers_received: number;
    vaccine_cold_chain_assessment: number;
    vaccine_monitors_training_and_deployment: number;
    penmarkers_supply: number;
    sia_training: number;
    sia_micro_planning: number;
    communication_sm_fund: number;
    communication_sm_activities: number;
    communication_c4d: number;
    status_score: number;
};

export type PreparednessScores = {
    planning_score: number;
    training_score: number;
    monitoring_score: number;
    vaccine_score: number;
    advocacy_score: number;
    adverse_score: number;
    security_score: number | null;
    status_score: number;
};

export type RegionName = string;
export type DistrictName = string;

export type RefreshPreparednessResponse = {
    national: PreparednessIndicator & { round: string };
    regions: {
        [key: RegionName]: PreparednessIndicator;
    };
    districts: {
        [key: DistrictName]: PreparednessScores &
            PreparednessIndicator & { region: string };
    };
    format: string;
    totals: {
        national_score: number;
        regional_score: number;
        district_score: number;
    };
    title: string;
    created_at: string;
    national_score: number;
    regional_score: number;
    district_score: number;
    overall_status_score: number;
    indicators: {
        [key: string]: {
            sn: number;
            key: string;
            title: string;
            national: number;
            regions: number;
            districts: number;
        };
    };
};
