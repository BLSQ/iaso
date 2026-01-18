import { Pagination, UrlParams } from 'bluesquare-components';
import { Profile } from 'Iaso/utils/usersUtils';
import { ShortOrgUnit } from '../../orgUnits/types/orgUnit';

export type StorageFilterParams = {
    performedAt?: string;
    type?: string;
    storageId?: string;
    search?: string;
    status?: string;
    reason?: string;
};
export type StorageParams = UrlParams &
    StorageFilterParams & {
        select?: (data: Array<Storage>) => Array<any>;
    };

export type StorageStatus = {
    status: 'OK' | 'BLACKLISTED';
    reason?: 'STOLEN' | 'LOST' | 'DAMAGED' | 'ABUSE' | 'OTHER';
    updated_at: number;
    comment?: string;
};

export type Log = {
    operation_type:
        | 'WRITE_PROFILE'
        | 'RESET'
        | 'READ'
        | 'WRITE_RECORD'
        | 'CHANGE_STATUS';
    status?: 'OK' | 'BLACKLISTED';
    status_reason?: string;
    status_comment?: string;
    storage_status: StorageStatus;
    instances: Array<number>; // array of instances ids
    org_unit: ShortOrgUnit;
    entity: any;
    performed_at: number;
    performed_by: Profile;
};

export type Storage = {
    id: number;
    storage_id: string;
    updated_at: number;
    created_at: number;
    storage_type: 'NFC' | 'USB' | 'SD';
    storage_status: StorageStatus;
    entity: any;
    logs?: Array<Log>;
    org_unit: ShortOrgUnit;
};
export interface PaginatedStorage extends Pagination {
    results: Storage;
}

export type Storages = Array<Storage>;

export interface StoragePaginated extends Pagination {
    results: Storages;
}
export type StorageDetailsParams = {
    type: string;
    storageId: string;
    pageSize: string;
    order: string;
    page: string;
    operationType?: string;
    performedAt?: string;
};
