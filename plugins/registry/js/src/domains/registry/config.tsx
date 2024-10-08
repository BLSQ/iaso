import MapIcon from '@mui/icons-material/Map';
import { Box } from '@mui/material';
import { Column, IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';

import { LinkToRegistry } from './components/LinkToRegistry';

import { InstanceMetasField } from '../../../../../../hat/assets/js/apps/Iaso/domains/instances/components/ColumnSelect';
import { Instance } from '../../../../../../hat/assets/js/apps/Iaso/domains/instances/types/instance';
import { OrgUnitLocationIcon } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/OrgUnitLocationIcon';
import { OrgUnit } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { MESSAGES } from './messages';

export const defaultSorted = [{ id: 'org_unit__name', desc: false }];

export const HEIGHT = '62vh';
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
            // eslint-disable-next-line react/jsx-no-useless-fragment
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
        active: true,
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
export const useGetOrgUnitsListColumns = (
    setSelectedChildren: Dispatch<SetStateAction<OrgUnit | undefined>>,
    selectedChildrenId: string | undefined,
): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
            align: 'left',

            Cell: settings => (
                <Box
                    sx={{
                        cursor: 'pointer',
                        color: 'primary.main',
                        fontWeight:
                            `${settings.row.original.id}` ===
                            `${selectedChildrenId}`
                                ? 'bold'
                                : 'normal',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                    onClick={() =>
                        setSelectedChildren(settings.row.original as OrgUnit)
                    }
                >
                    {settings.value}
                </Box>
            ),
        },
        {
            Header: formatMessage(MESSAGES.type),
            id: 'org_unit_type__name',
            accessor: 'org_unit_type_name',
        },
        {
            Header: (
                <Box position="relative" top={4} left={0}>
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
                <LinkToRegistry
                    orgUnit={settings.row.original}
                    replace
                    useIcon
                    size="small"
                    iconSize="small"
                />
            ),
        },
    ];
    return columns;
};
