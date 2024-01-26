/* eslint-disable camelcase */
import { Pagination } from 'bluesquare-components';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { User } from '../../../utils/usersUtils';

type Lock = {
    id: number;
    locked_by: User;
    unlocked_by?: User;
    top_org_unit: {
        name: string;
    };
};
export type ShortFile = {
    itemId: number;
    createdAt: number;
    path: string;
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
    accuracy: number;
    files: ShortFile[];
    status: string;
    export_statuses: Array<string>;
    correlation_id?: string;
    deleted: boolean;
    org_unit: OrgUnit;
    period?: string;
    file_content: Record<string, any>;
    form_descriptor: unknown;
    last_export_success_at: unknown;
    instance_locks: Lock[];
    can_user_modify: boolean;
    is_locked: boolean;
    is_instance_of_reference_form: boolean;
    is_reference_instance: boolean;
};

export type InstanceLogDetail = {
    id: number;
    content_type: string;
    object_id: string;
    source: string;
    user?: User;
    created_at: string;
};

export type InstanceLogsDetail = Pagination & {
    list: Array<InstanceLogDetail>;
};

type NewValue = {
    fields: Record<string, any>;
};

export type InstanceLogData = {
    id: number;
    content_type: string;
    object_id: string;
    new_value: NewValue[];
    source: string;
    user: User;
};

type FormVersions = {
    descriptor: Record<string, any>;
};
export type FormDescriptor = {
    form_versions: FormVersions[];
};

export type FileContent = {
    logA: Record<string, any>;
    logB: Record<string, any>;
};
export interface PaginatedInstances extends Pagination {
    instances: Instance[];
}
