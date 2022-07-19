import { OrgUnit } from '../../orgUnits/types/orgUnit';

export type Instance = {
    uuid: string;
    id: number;
    device_id: string;
    file_name: string;
    file_url: string;
    form_id: number;
    form_name: string;
    created_at: number;
    updated_at: number;
    latitude: number;
    longitude: number;
    altitude: number;
    files: Array<string>;
    status: string;
    export_statuses: Array<string>;
    correlation_id?: string;
    deleted: boolean;
    org_unit: OrgUnit;

    period: unknown;
    file_content: Record<string, string>;
    form_descriptor: unknown;
    last_export_success_at: unknown;
};

export type InstanceLogData = {
    fields: Record<string, any>;
    json: Record<string, any>;
    form: number;
};

export type InstanceLog = {
    old_value: InstanceLogData;
    new_value: InstanceLogData;
};

export type FormDescriptor = {
    descriptor: Record<string, any>;
};
