/* eslint-disable camelcase */
import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';
import { ChangesActionCell } from '../components/changes/ActionCell';

import { IntlFormatMessage } from '../../../types/intl';
import { Column } from '../../../types/table';
import { WorkflowVersionDetail } from '../types';
import { PossibleField } from '../../forms/types/forms';

export const useGetChangesColumns = (
    versionId: string,
    possibleFields: PossibleField[],
    workflowVersion?: WorkflowVersionDetail,
): Array<Column> => {
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
    if (workflowVersion?.status === 'DRAFT') {
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'id',
            Cell: settings => {
                const change = workflowVersion?.changes.find(
                    ch => ch.id === settings.value,
                );
                return (
                    <>
                        {workflowVersion && change && (
                            <ChangesActionCell
                                change={change}
                                versionId={versionId}
                                possibleFields={possibleFields}
                            />
                        )}
                    </>
                );
            },
        });
    }
    return columns;
};
