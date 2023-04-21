import React, { ReactElement } from 'react';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { Tooltip, Box } from '@material-ui/core';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import LocationDisabledIcon from '@material-ui/icons/LocationDisabled';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import MapIcon from '@material-ui/icons/Map';

import { baseUrls } from '../../constants/urls';
import { IntlFormatMessage } from '../../types/intl';

import { InstanceMetasField } from '../instances/components/ColumnSelect';
import { Instance } from '../instances/types/instance';
import { OrgUnit } from '../orgUnits/types/orgUnit';
import { Column } from '../../types/table';

import MESSAGES from './messages';
import ShapeSvg from '../../components/svg/ShapeSvgComponent';

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
            Cell: settings => {
                const {
                    latitude,
                    longitude,
                    has_geo_json: hasGeoJson,
                } = settings.row.original as OrgUnit;
                if (hasGeoJson) {
                    return (
                        <Tooltip
                            arrow
                            title={formatMessage(MESSAGES.withShape)}
                        >
                            <Box>
                                <ShapeSvg fontSize="small" color="primary" />
                            </Box>
                        </Tooltip>
                    );
                }
                if (latitude && longitude) {
                    return (
                        <Tooltip
                            arrow
                            title={formatMessage(MESSAGES.withLocation)}
                        >
                            <Box>
                                <LocationOnIcon
                                    fontSize="small"
                                    color="primary"
                                />
                            </Box>
                        </Tooltip>
                    );
                }
                return (
                    <Tooltip
                        arrow
                        title={formatMessage(MESSAGES.noGeographicalData)}
                    >
                        <Box>
                            <LocationDisabledIcon
                                fontSize="small"
                                color="error"
                            />
                        </Box>
                    </Tooltip>
                );
            },
        },
        {
            Header: (
                <Box position="relative" top={4} left={2}>
                    <AccountTreeIcon fontSize="small" color="inherit" />
                </Box>
            ),
            id: 'see',
            sortable: false,
            width: 50,
            Cell: settings => (
                <IconButton
                    icon="remove-red-eye"
                    url={`${baseUrls.registryDetail}/orgunitId/${settings.row.original.id}`}
                    tooltipMessage={MESSAGES.see}
                    iconSize="small"
                    color="primary"
                />
            ),
        },
    ];
    return columns;
};
