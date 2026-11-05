import { DropdownOptions } from 'Iaso/types/utils';

export type Step = {
    id: number;
    assistance_type: string;
    quantity_given: number;
    ration_size: string | null;
    instance_id: number | null;
};

export type Visit = {
    id: number;
    number: number;
    date: string | null;
    org_unit_id: number | null;
    org_unit_name: string | null;
    muac_size: string | null;
    whz_color: string | null;
    oedema: number | null;
    entry_point: string | null;
    instance_id: number | null;
    steps: Step[];
};

export type Journey = {
    id: number;
    nutrition_programme: string | null;
    programme_type: string | null;
    physiology_status: string | null;
    admission_type: string | null;
    admission_criteria: string | null;
    start_date: string | null;
    end_date: string | null;
    exit_type: string | null;
    instance_id: number | null;
    visits: Visit[];
};

export type Beneficiary = {
    id: number;
    entity_id: number;
    uuid: string;
    entity_type_id: number;
    entity_type_name: string;
    gender: string | null;
    birth_date: string;
    journeys_count: number;
    visits_count: number;
    last_visit_date: string | null;
    journeys: Journey[];
};

export type Filters = {
    entity_type?: string;
    programme?: string;
    org_unit_group?: string;
    q?: string;
};

export type Params = Filters & {
    accountId?: string;
    order?: string;
    pageSize?: string;
    page?: string;
};

export type BeneficiaryOptions = {
    entity_types: DropdownOptions<number>[];
    programmes: DropdownOptions<string>[];
    org_unit_groups: DropdownOptions<number>[];
};

export type ExportKind = 'coda' | 'raw';
