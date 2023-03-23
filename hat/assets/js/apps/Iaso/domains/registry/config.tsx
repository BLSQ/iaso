import React, { ReactElement } from 'react';

import { InstanceMetasField } from '../instances/components/ColumnSelect';
import { Instance } from '../instances/types/instance';

export const defaultSorted = [{ id: 'updated_at', desc: false }];

export const INSTANCE_METAS_FIELDS: InstanceMetasField[] = [
    {
        key: 'uuid',
        type: 'info',
    },
    {
        key: 'version',
        accessor: 'formVersion',
        active: false,
        sortable: false,
        tableOrder: 2,
        type: 'info',
        renderValue: (data: Instance): string => {
            return data.file_content?._version || '--';
        },
        Cell: (settings: Record<string, any>): ReactElement => {
            const data = settings.row.original;
            return <>{data.file_content?._version || '--'}</>;
        },
    },
    {
        key: 'updated_at',
        active: false,
        tableOrder: 3,
        type: 'info',
    },
    {
        key: 'created_at',
        active: false,
        tableOrder: 5,
        type: 'info',
    },
    {
        key: 'device_id',
        type: 'info',
    },
    {
        key: 'org_unit',
        accessor: 'org_unit__name',
        active: true,
        tableOrder: 4,
        type: 'location',
    },
    {
        key: 'latitude',
        type: 'location',
    },
    {
        key: 'longitude',
        type: 'location',
    },
    {
        key: 'period',
        tableOrder: 3,
        active: true,
        type: 'info',
    },
    {
        key: 'status',
        active: false,
        tableOrder: 6,
        type: 'info',
    },
    {
        key: 'last_modified_by',
        type: 'info',
    },
];
