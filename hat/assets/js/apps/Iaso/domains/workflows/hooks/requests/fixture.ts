const list = {
    results: [
        {
            version_id: '3',
            name: 'copy of version2',
            status: 'DRAFT',
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
        },
        {
            version_id: '2',
            name: 'version2',
            status: 'PUBLISHED',
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
        },
        {
            version_id: '1',
            name: 'version1',
            status: 'UNPUBLISHED',
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
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
        created_at: '2022-11-15T09:47:34.094067Z',
        updated_at: '2022-11-15T09:47:34.094067Z',
        reference_form: 987,
        fields_detail_info_view: [],
        fields_list_view: [],
    },
    reference_form: {
        id: 89,
        name: 'form name',
    },
    created_at: '2022-11-15T09:47:34.094067Z',
    updated_at: '2022-11-15T09:47:34.094067Z',
    changes: [
        {
            form_id: 89,
            form_name: 'form name',
            form: {
                id: 89,
                name: 'form name',
            },
            mapping: {
                key: 'value',
                key2: 'value2',
            },
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
        },
        {
            form: {
                id: 90,
                name: 'form name 2',
            },
            mapping: {
                key: 'value',
                key2: 'value2',
            },
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
        },
    ],
    follow_ups: [
        {
            id: 'THE_ID',
            order: 1,
            condition: {},
            forms: [
                {
                    id: 89,
                    name: 'form name',
                },
                {
                    id: 90,
                    name: 'form name 2',
                },
            ],
            created_at: '2022-11-15T09:47:34.094067Z',
            updated_at: '2022-11-15T09:47:34.094067Z',
        },
    ],
};
export { list, details };
