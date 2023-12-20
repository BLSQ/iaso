import React, { ReactElement } from 'react';
import { useSafeIntl, IntlFormatMessage, Column } from 'bluesquare-components';
import { Box } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

import { InstanceMetasField } from '../instances/components/ColumnSelect';
import { Instance } from '../instances/types/instance';

import { LinkToRegistry } from './components/LinkToRegistry';

import MESSAGES from './messages';
import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { OrgUnitLocationIcon } from '../orgUnits/components/OrgUnitLocationIcon';

export const defaultSorted = [{ id: 'org_unit__name', desc: false }];

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
        key: 'last_modified_by',
        type: 'info',
    },
];

export const useGetOrgUnitsListColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
            align: 'left',
        },
        {
            Header: formatMessage(MESSAGES.type),
            id: 'org_unit_type__name',
            accessor: 'org_unit_type_name',
        },
        {
            Header: (
                <Box position="relative" top={4} left={5}>
                    <MapIcon fontSize="small" color="inherit" />
                </Box>
            ),
            id: 'location',
            accessor: 'location',
            width: 50,
            Cell: settings => (
                <OrgUnitLocationIcon orgUnit={settings.row.original} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.actions),
            id: 'see',
            sortable: false,
            width: 50,
            Cell: settings => (
                <>
                    <Box display="inline-block" mr={1}>
                        <LinkToOrgUnit
                            orgUnit={settings.row.original}
                            useIcon
                            size="small"
                            iconSize="small"
                        />
                    </Box>
                    <LinkToRegistry
                        orgUnit={settings.row.original}
                        replace
                        useIcon
                        size="small"
                        iconSize="small"
                    />
                </>
            ),
        },
    ];
    return columns;
};
