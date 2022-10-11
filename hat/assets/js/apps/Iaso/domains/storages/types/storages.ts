/* eslint-disable camelcase */
import { Pagination, UrlParams } from '../../../types/table';

import { Entity } from '../../entities/types/entity';
import { ShortOrgUnit } from '../../orgUnits/types/orgUnit';
import { Profile } from '../../../utils/usersUtils';

export type StorageFilterParams = {
    performedAt?: string;
    storageType?: string;
    storageId?: string;
    search?: string;
};
export type StorageParams = UrlParams &
    StorageFilterParams & {
        select?: (
            // eslint-disable-next-line no-unused-vars
            data: Array<Storage>,
        ) => Array<any>;
    };

type StorageStatus = {
    status: 'OK' | 'BLACKLISTED';
    reason?: 'STOLEN' | 'LOST' | 'DAMAGED' | 'ABUSE' | 'OTHER';
    updated_at: number;
};

type Log = {
    operation_type: 'OK' | 'BLACKLISTED';
    storage_status: StorageStatus;
    forms: Array<number>; // array of instances ids
    org_unit: ShortOrgUnit;
    entity: Entity;
    performed_at: number;
    performed_by: Profile;
};

export type Storage = {
    uuid: string;
    storage_id: string;
    storage_type: 'NFC' | 'USB' | 'SD';
    storage_status: StorageStatus;
    entity: Entity;
    logs: Array<Log>;
};

export type Storages = Array<Storage>;

export interface StoragePaginated extends Pagination {
    results: Storages;
}
