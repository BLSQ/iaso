/* eslint-disable camelcase */
import React, { ReactNode, Dispatch, SetStateAction } from 'react';
import { useSafeIntl, QueryBuilderFields } from 'bluesquare-components';
import { Box } from '@material-ui/core';

import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';

import { IntlFormatMessage } from '../../../types/intl';
import { Column } from '../../../types/table';

import { FollowUpActionCell } from '../components/followUps/ActionCell';
import { WorkflowVersionDetail } from '../types';
import { iasoFields, Field } from '../../forms/fields/constants';

interface FollowUpsColumns extends Column {
    accessor: string;
}

export const getConfigFields = (): Field[] => {
    const configFields = [...iasoFields];
    if (configFields[2].queryBuilder?.operators) {
        configFields[2].queryBuilder.operators = [
            'equal',
            'not_equal',
            'greater_or_equal',
            'less_or_equal',
        ];
    }
    if (configFields[3].queryBuilder?.operators) {
        configFields[3].queryBuilder.operators = [
            'equal',
            'not_equal',
            'greater_or_equal',
            'less_or_equal',
        ];
    }
    return configFields;
};

export const useGetFollowUpsColumns = (
    getHumanReadableJsonLogic: (
        // eslint-disable-next-line no-unused-vars
        logic: Record<string, string>,
    ) => string | ReactNode,
    versionId: string,
    workflowVersion?: WorkflowVersionDetail,
    fields?: QueryBuilderFields,
    setCurrentFields?: Dispatch<SetStateAction<QueryBuilderFields>>,
): FollowUpsColumns[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const columns: FollowUpsColumns[] = [
        {
            Header: formatMessage(MESSAGES.condition),
            sortable: false,
            accessor: 'condition',
            Cell: settings => {
                const condition = settings.value;
                return (
                    <>
                        {/* If there you add a condition, the value will be an object. Otherwise it will return true */}
                        {typeof condition === 'object'
                            ? getHumanReadableJsonLogic(condition)
                            : formatMessage(MESSAGES.noCondition)}
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
                                setCurrentFields={newFields => {
                                    console.log('new Fields', newFields);
                                    setCurrentFields(newFields);
                                }}
                            />
                        )}
                    </>
                );
            },
        });
    } else {
        columns.unshift({
            Header: formatMessage(MESSAGES.order),
            resizable: false,
            sortable: false,
            accessor: 'order',
            width: 20,
            Cell: settings => {
                return <>{parseInt(settings.value, 10) + 1}</>;
            },
        });
    }
    return columns;
};
