import MapIcon from '@mui/icons-material/Map';
import { Box } from '@mui/material';
import { Column, IntlFormatMessage, useSafeIntl } from 'bluesquare-components';
import React, { Dispatch, SetStateAction } from 'react';

import { LinkToRegistry } from './LinkToRegistry';

import { OrgUnitLocationIcon } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/OrgUnitLocationIcon';
import { OrgUnit } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { MESSAGES } from './messages';

export const defaultSorted = [{ id: 'org_unit__name', desc: false }];

export const HEIGHT = '62vh';

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
