import React, { useMemo } from 'react';
import { makeStyles } from '@mui/styles';
import Color from 'color';
import {
    commonStyles,
    useSafeIntl,
    Column,
    IntlFormatMessage,
    textPlaceholder,
} from 'bluesquare-components';
import OrgUnitTooltip from '../components/OrgUnitTooltip';
import MESSAGES from '../messages';
import { useGetStatusMessage, getOrgUnitProjects } from '../utils';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { Search } from '../types/search';
import { ActionCell } from '../components/ActionCell';

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
    const getStatusMessage = useGetStatusMessage();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const cols = useMemo(() => {
        const columns: Column[] = [
            {
                Header: 'Id',
                accessor: 'id',
            },
            {
                Header: formatMessage(MESSAGES.projects),
                accessor: 'projects',
                sortable: false,
                Cell: settings => getOrgUnitProjects(settings.row.original),
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
                Header: formatMessage(MESSAGES.source),
                accessor: 'source',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'validation_status',
                Cell: settings => getStatusMessage(settings.value),
            },
            {
                Header: formatMessage(MESSAGES.instances_count),
                accessor: 'instances_count',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },

            {
                Header: formatMessage(MESSAGES.creator),
                accessor: 'creator',
                id: 'creator',
                Cell: settings => {
                    return settings.row.original.creator || textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                width: 250,
                Cell: settings => (
                    <ActionCell orgUnit={settings.row.original} />
                ),
            },
        ];
        const searchCount = searches && searches.length;
        if (searchCount > 1) {
            columns.unshift({
                Header: formatMessage(MESSAGES.search),
                accessor: 'search_index',
                width: 100,
                Cell: settings => {
                    const color =
                        searches[settings.row.original.search_index]?.color ??
                        undefined;
                    return (
                        <section>
                            <span
                                style={
                                    color
                                        ? {
                                              backgroundColor: `#${color}`,
                                              border: `2px solid ${Color(
                                                  `#${color}`,
                                              ).darken(0.5)}`,
                                          }
                                        : {}
                                }
                                className={classes.roundColor}
                            />
                        </section>
                    );
                },
            });
        }
        return columns;
    }, [classes.roundColor, formatMessage, getStatusMessage, searches]);
    return cols;
};
