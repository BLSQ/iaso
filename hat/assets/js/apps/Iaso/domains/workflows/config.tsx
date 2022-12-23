/* eslint-disable camelcase */
import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    QueryBuilderFields,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';

import MESSAGES from './messages';
import { DateCell } from '../../components/Cells/DateTimeCell';
import { LinkToForm } from '../forms/components/LinkToForm';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { baseUrls } from '../../constants/urls';

import { StatusCell } from './components/StatusCell';
import { VersionsActionCell } from './components/VersionsActionCell';
import { FollowUpActionCell } from './components/FollowUpActionCell';
import { WorkflowVersionDetail } from './types/workflows';

export const defaultSorted = [{ id: 'id', desc: true }];

export const baseUrl = baseUrls.workflows;

export const useGetColumns = (entityTypeId: string): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.version),
            id: 'id',
            accessor: 'version_id',
        },
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.status),
            id: 'status',
            accessor: 'status',
            Cell: settings => {
                const { status } = settings.row.original;
                return <StatusCell status={status} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'actions',
            Cell: settings => (
                <VersionsActionCell
                    workflowVersion={settings.row.original}
                    entityTypeId={parseInt(entityTypeId, 10)}
                />
            ),
        },
    ];
    return columns;
};

export const useGetFollowUpsColumns = (
    // eslint-disable-next-line no-unused-vars
    getHumanReadableJsonLogic: (logic: Record<string, string>) => string,
    workflow?: WorkflowVersionDetail,
    fields?: QueryBuilderFields,
): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.condition),
            sortable: false,
            accessor: 'condition',
            Cell: settings => {
                const condition = settings.value;
                return (
                    <>
                        {condition ? getHumanReadableJsonLogic(condition) : '-'}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.forms),
            sortable: false,
            accessor: 'forms',
            Cell: settings => {
                const forms = settings.value;
                return forms?.map((form, index) => (
                    <Box key={form.id}>
                        <LinkToForm formId={form.id} formName={form.name} />
                        {index + 1 < forms.length ? ', ' : ''}
                    </Box>
                ));
            },
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            sortable: false,
            accessor: 'created_at',
            Cell: DateCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            sortable: false,
            Cell: DateCell,
        },
    ];
    if (workflow?.status === 'DRAFT') {
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'id',
            Cell: settings => {
                const followUp = workflow?.follow_ups.find(
                    fu => fu.id === settings.value,
                );
                return (
                    <>
                        {workflow && followUp && fields && (
                            <FollowUpActionCell
                                followUp={followUp}
                                status={workflow.status}
                                fields={fields}
                            />
                        )}
                    </>
                );
            },
        });
    }
    return columns;
};

export const useGetChangesColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Array<Column> = [
        {
            Header: formatMessage(MESSAGES.form),
            id: 'form_name',
            accessor: 'form__name',
            Cell: settings => {
                return (
                    <LinkToForm
                        formId={settings.row.original.form.id}
                        formName={settings.row.original.form.name}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.mapping),
            id: 'mapping',
            accessor: 'mapping',
            sortable: false,
            Cell: settings => {
                return (
                    <>
                        {Object.keys(settings.row.original.mapping)
                            .map(mapKey => mapKey)
                            .join(', ')}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            id: 'created_at',
            Cell: DateCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            id: 'updated_at',
            Cell: DateCell,
        },
    ];
    return columns;
};
