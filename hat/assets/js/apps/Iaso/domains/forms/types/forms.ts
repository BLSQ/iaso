/* eslint-disable camelcase */
type FeatureFlag = {
    id: number;
    name: string;
    code: string;
    description: string;
    created_at: number;
    updated_at: number;
};

type Project = {
    id: number;
    name: string;
    app_id: string;
    feature_flags: FeatureFlag[];
    created_at: string;
    updated_at: string;
    needs_authentication: boolean;
};

type PossibleField = {
    label: string;
    name: string;
    type: string;
};

export type Form = {
    id: number;
    name: string;
    form_id: string;
    device_field: string;
    location_field: string;
    org_unit_types: string;
    org_unit_type_ids: number[];
    projects: Project[];
    project_ids: number[];
    period_type: 'MONTH' | 'QUARTER' | 'SIX_MONTH' | 'YEAR';
    single_per_period: boolean;
    periods_before_allowed: number;
    periods_after_allowed: number;
    latest_form_version: string;
    instances_count: number;
    instance_updated_at: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    derived: boolean;
    label_keys: string[];
    possible_fields: PossibleField[];
};
