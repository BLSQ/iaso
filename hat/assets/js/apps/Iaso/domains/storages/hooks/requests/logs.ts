import { StoragePaginated } from '../../types/storages';

export const logs: StoragePaginated = {
    pages: 1,
    page: 1,
    count: 3,
    limit: 20,
    has_next: false,
    has_previous: false,
    results: [
        {
            uuid: 'dqsdqsdqscqssdqs',
            storage_id: 'dsqdsqdqs',
            storage_type: 'NFC',
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
            logs: [
                {
                    operation_type: 'OK',
                    storage_status: {
                        status: 'OK',
                        updated_at: 1622711216.813267,
                    },
                    forms: [987, 888],
                    org_unit: {
                        name: 'OU NAME',
                        id: 2,
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
                    performed_at: 1622711216.813267,
                    performed_by: {
                        id: '1',
                        first_name: 'first_name',
                        user_name: 'user_name',
                        last_name: 'last_name',
                        email: 'email',
                        user_id: 2,
                    },
                },
            ],
        },
    ],
};
