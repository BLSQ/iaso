/* eslint-disable camelcase */
import React from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    QueryBuilderFields,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';

import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';

import { IntlFormatMessage } from '../../../types/intl';
import { Column } from '../../../types/table';

import { FollowUpActionCell } from '../components/followUps/ActionCell';
import { WorkflowVersionDetail } from '../types';

export const useGetFollowUpsColumns = (
    // eslint-disable-next-line no-unused-vars
    getHumanReadableJsonLogic: (logic: Record<string, string>) => string,
    versionId: string,
    workflowVersion?: WorkflowVersionDetail,
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
    if (workflowVersion?.status === 'DRAFT') {
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            resizable: false,
            sortable: false,
            accessor: 'id',
            Cell: settings => {
                const followUp = workflowVersion?.follow_ups.find(
                    fu => fu.id === settings.value,
                );
                return (
                    <>
                        {workflowVersion && followUp && fields && (
                            <FollowUpActionCell
                                followUp={followUp}
                                fields={fields}
                                versionId={versionId}
                            />
                        )}
                    </>
                );
            },
        });
    }
    return columns;
};
