/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import React, { ReactElement, useMemo } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
    Column,
} from 'bluesquare-components';

import moment from 'moment';
import _ from 'lodash';
import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import {
    DateCell,
    DateTimeCell,
    DateTimeCellRfc,
} from '../../components/Cells/DateTimeCell';

import { IntlFormatMessage } from '../../types/intl';
import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';

import { ExtraColumn } from './types/fields';
import getDisplayName from '../../utils/usersUtils';
import { useGetFieldValue } from './hooks/useGetFieldValue';
import { formatLabel } from '../instances/utils';

export const baseUrl = baseUrls.entities;

export const defaultSorted = [{ id: 'last_saved_instance', desc: false }];

export const useStaticColumns = (): Array<Column> => {
    const getValue = useGetFieldValue();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            Header: formatMessage(MESSAGES.id),
            id: 'uuid',
            accessor: 'uuid',
        },
        {
            Header: formatMessage(MESSAGES.lastVisit),
            id: 'last_saved_instance',
            accessor: 'last_saved_instance',
            Cell: settings => {
                return (
                    <>
                        {getValue(
                            'last_saved_instance',
                            settings.row.original,
                            'date',
                        )}
                    </>
                );
            },
        },
        {
            Header: 'HC',
            id: 'attributes__org_unit__name',
            accessor: 'attributes__org_unit__name',
            Cell: settings => {
                return settings.row.original?.org_unit ? (
                    <LinkToOrgUnit orgUnit={settings.row.original?.org_unit} />
                ) : (
                    <>--</>
                );
            },
        },
    ];
};

export const useColumns = (
    entityTypeIds: string[],
    extraColumns: Array<ExtraColumn>,
): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const staticColumns = useStaticColumns();
    const getValue = useGetFieldValue();
    return useMemo(() => {
        const columns: Array<Column> = staticColumns;
        if (entityTypeIds.length !== 1) {
            columns.unshift({
                Header: formatMessage(MESSAGES.type),
                id: 'entity_type',
                accessor: 'entity_type',
            });
        }
        extraColumns.forEach(extraColumn => {
            columns.push({
                Header: formatLabel(extraColumn),
                id: extraColumn.name,
                accessor: extraColumn.name,
                Cell: settings => {
                    return (
                        <>
                            {getValue(
                                extraColumn.name,
                                settings.row.original,
                                extraColumn.type,
                            )}
                        </>
                    );
                },
            });
        });
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => (
                // TODO: limit to user permissions
                <>
                    <IconButtonComponent
                        url={`/${baseUrls.entityDetails}/entityId/${settings.row.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.see}
                    />
                </>
            ),
        });
        return columns;
    }, [
        staticColumns,
        entityTypeIds.length,
        extraColumns,
        formatMessage,
        getValue,
    ]);
};

const generateColumnsFromFieldsList = (
    fields: string[],
    formatMessage: IntlFormatMessage,
): Column[] => {
    return fields.map(field => {
        return {
            Header: formatMessage(MESSAGES[field]) ?? field,
            id: `${field}`,
            accessor: `${field}`,
            Cell: settings => {
                const data = _.get(settings.row.original, field);
                const asDateTime = moment(data, 'DD-MM-YYYYThh:mm:ssZ', true);
                const asDate = moment(data, 'DD-MM-YYYY', true);
                if (asDateTime.isValid()) {
                    return (
                        <DateTimeCellRfc value={moment(data).format('LTS')} />
                    );
                }
                if (asDate.isValid()) {
                    return <DateCell value={moment(data).format('L')} />;
                }

                return <>{data ?? '--'}</>;
            },
        };
    });
};

export const useColumnsFromFieldsList = (
    fields: Array<string> = [],
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => generateColumnsFromFieldsList(fields, formatMessage),
        [fields, formatMessage],
    );
};

export const useBeneficiariesDetailsColumns = (
    entityId: number | null,
    fields: Array<string> = [],
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const columnsFromList: Column[] = useColumnsFromFieldsList(fields);
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.form),
                id: 'form__name',
                accessor: 'form_name',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.last_sync_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.OrgUnitName),
                id: 'org_unit__name',
                accessor: 'org_unit.name',
            },
            {
                Header: formatMessage(MESSAGES.submitter),
                id: 'created_by',
                accessor: 'created_by.user_name',
                Cell: settings => {
                    const { created_by: user } = settings.row.original;
                    return <>{getDisplayName(user)}</>;
                },
            },
            ...columnsFromList,
            {
                Header: formatMessage(MESSAGES.actions),
                sortable: false,
                id: 'actions',
                Cell: (settings): ReactElement => (
                    // TODO: limit to user permissions
                    <section>
                        <IconButtonComponent
                            url={`/${baseUrls.entitySubmissionDetail}/instanceId/${settings.row.original.id}/entityId/${entityId}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.see}
                            disabled={!entityId}
                        />
                    </section>
                ),
            },
        ],
        [entityId, columnsFromList, formatMessage],
    );
};
