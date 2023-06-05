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
// https://xlsform.org/en/#question-types
export type FieldType =
    | 'integer'
    | 'decimal'
    | 'range'
    | 'text'
    | 'select one'
    | 'select multiple'
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

export type PossibleField = {
    label: string;
    name: string;
    type: FieldType;
    fieldKey: string;
};
export type ChildrenDescriptor = {
    label: string;
    name: string;
    type: FieldType;
    children: ChildrenDescriptor[];
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

export type FormDescriptor = {
    default_language: string;
    id_string: string;
    name: string;
    title: string;
    version: string;
    type: string;
    children: ChildrenDescriptor[];
};

export type FormAttachment = {
    id: number;
    name: string;
    file: string;
    md5: string;
    form_id: number;
    created_at: number;
    updated_at: number;
};
export type FormParams = {
    formId: string;
    tab?: string;
    attachmentsOrder?: string;
    attachmentsPageSize?: string;
    attachmentsPage?: string;
};
