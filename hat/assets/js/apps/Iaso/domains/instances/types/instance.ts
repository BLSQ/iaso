/* eslint-disable camelcase */
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

export type InstanceLogsDetail = {
    count: number;
    list: Array<any>;
};

export type InstanceLogDetail = {
    id: number;
    content_type: string;
    object_id: string;
    source: string;
    user: Record<string, any>;
    created_at: string;
};

export type InstanceLogData = {
    fields: Record<string, any>;
    json: Record<string, any>;
    _version: string;
    form: number;
};

export type InstanceLog = {
    old_value: InstanceLogData;
    new_value: InstanceLogData;
};

export type FormDescriptor = {
    descriptor: Record<string, any>;
};
