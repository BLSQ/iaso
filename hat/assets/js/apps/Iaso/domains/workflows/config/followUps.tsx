/* eslint-disable camelcase */
import React, { ReactNode } from 'react';
import {
    useSafeIntl,
    QueryBuilderFields,
    IntlFormatMessage,
    Column,
} from 'bluesquare-components';
import { Box } from '@mui/material';

import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToForm } from '../../forms/components/LinkToForm';
import { getLocaleDateFormat } from '../../../utils/dates';

import { FollowUpActionCell } from '../components/followUps/ActionCell';
import { WorkflowVersionDetail } from '../types';
import { Field } from '../../forms/fields/constants';

interface FollowUpsColumns extends Column {
    accessor: string;
}
export const iasoFields: Field[] = [
    {
        type: 'text',
        queryBuilder: {
            type: 'text',
            excludeOperators: [
                'proximity',
                'ends_with',
                'starts_with',
                'like',
                'not_like',
                'is_empty',
                'is_not_empty',
            ],
        },
    },
    {
        type: 'note',
        queryBuilder: {
            type: 'text',
            excludeOperators: [
                'proximity',
                'ends_with',
                'starts_with',
                'like',
                'not_like',
                'is_empty',
                'is_not_empty',
            ],
        },
    },
    {
        type: 'integer',
        queryBuilder: {
            type: 'number',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
            preferWidgets: ['number'],
        },
    },
    {
        type: 'decimal',
        queryBuilder: {
            type: 'number',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
            preferWidgets: ['number'],
        },
    },
    {
        type: 'select_one',
        alias: 'select one',
        useListValues: true,
        queryBuilder: {
            type: 'select',
            excludeOperators: [
                'proximity',
                'select_any_in',
                'select_not_any_in',
            ],
            valueSources: ['value'],
        },
    },
    {
        type: 'date',
        queryBuilder: {
            type: 'currentDate',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
        },
    },
    {
        type: 'dateTime',
        queryBuilder: {
            type: 'currentDatetime',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
        },
    },
    {
        type: 'select_multiple',
        alias: 'select multiple',
        disabled: true,
        useListValues: true,
        queryBuilder: {
            type: 'multiselect',
            excludeOperators: [
                'proximity',
                'select_any_in',
                'select_not_any_in',
            ],
            valueSources: ['value'],
        },
    },
    {
        type: 'time',
        queryBuilder: {
            type: 'time',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
            fieldSettings: {
                timeFormat: getLocaleDateFormat('LT'),
            },
        },
    },
    {
        type: 'range',
        disabled: true,
    },
    {
        type: 'select_one_from_file',
        disabled: true,
    },
    {
        type: 'select_multiple_from_file',
        disabled: true,
    },
    {
        type: 'rank',
        disabled: true,
    },
    {
        type: 'rank',
        disabled: true,
    },
    {
        type: 'geopoint',
        disabled: true,
    },
    {
        type: 'geotrace',
        disabled: true,
    },
    {
        type: 'geoshape',
        disabled: true,
    },
    {
        type: 'start',
        disabled: true,
    },
    {
        type: 'end',
        disabled: true,
    },
    {
        type: 'image',
        disabled: true,
    },
    {
        type: 'audio',
        disabled: true,
    },
    {
        type: 'background-audio',
        disabled: true,
    },
    {
        type: 'video',
        disabled: true,
    },
    {
        type: 'file',
        disabled: true,
    },
    {
        type: 'barcode',
        disabled: true,
    },
    {
        type: 'calculate',
        queryBuilder: {
            type: 'text',
            operators: [
                'equal',
                'not_equal',
                'greater_or_equal',
                'less_or_equal',
            ],
        },
    },
    {
        type: 'acknowledge',
        disabled: true,
    },
    {
        type: 'hidden',
        disabled: true,
    },
    {
        type: 'xml-external',
        disabled: true,
    },
];

export const useGetFollowUpsColumns = (
    getHumanReadableJsonLogic: (
        // eslint-disable-next-line no-unused-vars
        logic: Record<string, string>,
    ) => string | ReactNode,
    versionId: string,
    workflowVersion?: WorkflowVersionDetail,
    fields?: QueryBuilderFields,
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
