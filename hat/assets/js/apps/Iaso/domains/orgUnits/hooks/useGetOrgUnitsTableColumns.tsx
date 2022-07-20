import React from 'react';
import { makeStyles } from '@material-ui/core';
import Color from 'color';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import OrgUnitTooltip from '../components/OrgUnitTooltip';
import MESSAGES from '../messages';
import { getStatusMessage, getOrgUnitGroups } from '../utils';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';

import { Search } from '../types/search';
import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    roundColor: {
        display: 'inline-block',
        width: 15,
        height: 15,
        borderRadius: 15,
    },
    statusNew: {
        color: theme.palette.primary.main,
    },
    statusValidated: {
        color: theme.palette.success.main,
    },
    statusRejected: {
        color: theme.palette.error.main,
    },
}));

export const useGetOrgUnitsTableColumns = (searches: [Search]): Column[] => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const getStatusColor = status => {
        switch (status) {
            case 'NEW': {
                // value taken from /iaso/hat/assets/css/_iaso.scss
                return classes.statusNew;
            }
            case 'REJECTED': {
                return classes.statusRejected;
            }
            default:
                return classes.statusValidated;
        }
    };
    const columns: Column[] = [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            Cell: settings => (
                <OrgUnitTooltip orgUnit={settings.row.original}>
                    <span>{settings.row.original.name}</span>
                </OrgUnitTooltip>
            ),
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'org_unit_type_name',
            id: 'org_unit_type__name',
        },
        {
            Header: formatMessage(MESSAGES.groups),
            accessor: 'groups',
            sortable: false,
            width: 400,
            Cell: settings => getOrgUnitGroups(settings.row.original),
        },
        {
            Header: formatMessage(MESSAGES.source),
            accessor: 'source',
            sortable: false,
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'validation_status',
            Cell: settings => (
                <span className={getStatusColor(settings.value)}>
                    {getStatusMessage(settings.value, formatMessage)}
                </span>
            ),
        },
        {
            Header: formatMessage(MESSAGES.instances_count),
            accessor: 'instances_count',
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.action),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            width: 250,
            Cell: settings => (
                <section>
                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/infos`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.details}
                    />
                    {(settings.row.original.has_geo_json ||
                        Boolean(
                            settings.row.original.latitude &&
                                settings.row.original.longitude,
                        )) && (
                        <IconButtonComponent
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/map`}
                            icon="map"
                            tooltipMessage={MESSAGES.map}
                        />
                    )}

                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/history`}
                        icon="history"
                        tooltipMessage={MESSAGES.history}
                    />
                </section>
            ),
        },
    ];
    const searchCount = searches && searches.length;
    if (searchCount > 1) {
        columns.unshift({
            Header: formatMessage(MESSAGES.search),
            accessor: 'search_index',
            width: 100,
            Cell: settings => (
                <section>
                    <span
                        style={
                            settings.row.original.color
                                ? {
                                      backgroundColor: `#${settings.row.original.color}`,
                                      border: `2px solid ${Color(
                                          `#${settings.row.original.color}`,
                                      ).darken(0.5)}`,
                                  }
                                : {}
                        }
                        className={classes.roundColor}
                    />
                </section>
            ),
        });
    }
    return columns;
};
