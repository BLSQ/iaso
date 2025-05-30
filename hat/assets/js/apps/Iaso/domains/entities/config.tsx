import React, { ReactElement, useMemo } from 'react';

import FileCopyIcon from '@mui/icons-material/FileCopy';
import {
    Column,
    IconButton as IconButtonComponent,
    IntlFormatMessage,
    LinkWithLocation,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import _ from 'lodash';
import moment from 'moment';
import {
    DateCell,
    DateTimeCell,
    DateTimeCellRfc,
} from '../../components/Cells/DateTimeCell';

import { baseUrls } from '../../constants/urls';

import getDisplayName from '../../utils/usersUtils';
import { LinkToInstance } from '../instances/components/LinkToInstance';
import { formatLabel } from '../instances/utils';
import { LinkToOrgUnit } from '../orgUnits/components/LinkToOrgUnit';
import { filterOrgUnitsByGroupUrl } from '../orgUnits/utils';
import { useGetFieldValue } from './hooks/useGetFieldValue';
import MESSAGES from './messages';
import { ExtraColumn } from './types/fields';

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
            Header: 'Groups',
            id: 'attributes__org_unit__groups',
            sortable: false,
            Cell: settings => {
                const groups = settings.row.original?.org_unit?.groups;
                if (!groups || groups.length === 0) {
                    return <span>{textPlaceholder}</span>;
                }

                return groups.map((group, index) => (
                    <span key={group.id}>
                        <LinkWithLocation
                            to={filterOrgUnitsByGroupUrl(group.id)}
                        >
                            {group.name}
                        </LinkWithLocation>
                        {index !== groups.length - 1 && ', '}
                    </span>
                ));
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
                    <span>{textPlaceholder}</span>
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
            Cell: (settings): ReactElement => {
                // TODO: limit to user permissions
                return (
                    <>
                        <IconButtonComponent
                            url={`/${baseUrls.entityDetails}/entityId/${settings.row.original.id}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.see}
                        />
                        {settings.row.original.duplicates.length === 1 && (
                            <IconButtonComponent
                                url={`/${baseUrls.entityDuplicateDetails}/entities/${settings.row.original.id},${settings.row.original.duplicates[0]}/`}
                                overrideIcon={FileCopyIcon}
                                tooltipMessage={MESSAGES.seeDuplicate}
                            />
                        )}
                        {/* When there's more than one dupe for the entity */}
                        {settings.row.original.duplicates.length > 1 && (
                            <IconButtonComponent
                                url={`/${baseUrls.entityDuplicates}/entity_id/${settings.row.original.id}/order/id/pageSize/50/page/1/`}
                                overrideIcon={FileCopyIcon}
                                tooltipMessage={MESSAGES.seeDuplicates}
                            />
                        )}
                    </>
                );
            },
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

                return <span>{data ?? '--'}</span>;
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

export const useEntitiesDetailsColumns = (
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
                id: 'source_created_at',
                accessor: 'source_created_at',
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
                        <LinkToInstance
                            instanceId={settings.row.original.id}
                            useIcon
                        />
                    </section>
                ),
            },
        ],
        [formatMessage, columnsFromList, entityId],
    );
};
