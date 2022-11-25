const list = {
    results: [
        {
            version_id: '3',
            name: 'copy of version2',
            status: 'DRAFT',
            created_at: 1667821202.186868,
            updated_at: 1667821202.186868,
        },
        {
            version_id: '2',
            name: 'version2',
            status: 'PUBLISHED',
            created_at: 1667821202.186868,
            updated_at: 1667821202.186868,
        },
        {
            version_id: '1',
            name: 'version1',
            status: 'UNPUBLISHED',
            created_at: 1667821202.186868,
            updated_at: 1667821202.186868,
        },
    ],
    count: 580,
    has_next: true,
    has_previous: false,
    page: 1,
    pages: 2,
    limit: 20,
};
const details = {
    version_id: '2',
    name: 'copy of version2',
    status: 'DRAFT',
    entity_type: {
        id: 1,
        name: 'entity_type name',
        created_at: 1667821202.186868,
        updated_at: 1667821202.186868,
        reference_form: 987,
        fields_detail_info_view: [],
        fields_list_view: [],
    },
    reference_form: {
        id: 89,
        name: 'form name',
    },
    created_at: 1667821202.186868,
    updated_at: 1667821202.186868,
    changes: [
        {
            form_id: 89,
            mapping: {
                key: 'value',
                key2: 'value2',
            },
            created_at: 1667821202.186868,
            updated_at: 1667821202.186868,
        },
    ],
    follow_ups: [
        {
            id: 'THE_ID',
            order: 1,
            condition: {},
            form_ids: [90, 91],
            created_at: 1667821202.186868,
            updated_at: 1667821202.186868,
        },
    ],
};
export { list, details };
