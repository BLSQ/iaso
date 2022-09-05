/* eslint-disable camelcase */
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { Pagination } from '../../../types/table';
import { User } from '../../../utils/usersUtils';

type Lock = {
    id: number;
    locked_by: User;
    unlocked_by?: User;
    top_org_unit: {
        name: string;
    };
};

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
    instance_locks: Lock[];
    can_user_modify: boolean;
};

export type InstanceLogDetail = {
    id: number;
    content_type: string;
    object_id: string;
    source: string;
    user: Record<string, any>;
    created_at: string;
};

export type InstanceLogsDetail = Pagination & {
    list: Array<InstanceLogDetail>;
};

type NewValue = {
    fields: Record<string, any>;
};

export type InstanceLogData = {
    fields: Record<string, any>;
    json: Record<string, any>;
    _version: string;
    form: number;
    new_value: NewValue[];
};

type FormVersions = {
    descriptor: Record<string, any>;
};
export type FormDescriptor = {
    form_versions: FormVersions[];
};
