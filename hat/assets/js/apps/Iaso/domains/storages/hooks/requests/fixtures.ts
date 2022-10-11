import { StoragePaginated } from '../../types/storages';

export const Storages: StoragePaginated = {
    pages: 1,
    page: 1,
    count: 3,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            updated_at: 1622711216.813267,
            created_at: 1622711216.813267,
            storage_id: 'dsqdsqdqs',
            storage_type: 'NFC',
            org_unit: {
                name: 'name',
                id: 9875,
            },
            storage_status: {
                status: 'OK',
                updated_at: 1622711216.813267,
            },
            entity: {
                id: 5,
                uuid: 'dfsd',
                name: 'name',
                created_at: 1622711216.813267,
                updated_at: 1622711216.813267,
                attributes: 9064,
                entity_type: 1,
                entity_type_name: 'entity_type_name',
            },
        },
    ],
};
