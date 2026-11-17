import React from 'react';
import {
    IconButton as IconButtonComponent,
    Column,
} from 'bluesquare-components';
import { FormatMessage } from 'Iaso/types/general';
import { ColumnCell } from 'Iaso/types/general';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { MappingVersionRow, QuestionStatus } from './types';

export const baseUrl = baseUrls.mappings;

// status of one question
export const QUESTION_STATUS_MESSAGES = {
    [QuestionStatus.MAPPED]: MESSAGES.questionMapped,
    [QuestionStatus.UNMAPPED]: MESSAGES.questionUnmapped,
    [QuestionStatus.NEVER]: MESSAGES.questionNever,
};

// status filter chips, plural
export const STATUS_FILTER_MESSAGES = {
    [QuestionStatus.MAPPED]: MESSAGES.statusMapped,
    [QuestionStatus.UNMAPPED]: MESSAGES.statusUnmapped,
    [QuestionStatus.NEVER]: MESSAGES.statusNever,
};

const safePercent = (a: number, b: number) => {
    if (b === 0) {
        return '-';
    }
    return (100 * (a / b)).toFixed(2);
};

export const mappingsTableColumns = (
    formatMessage: FormatMessage,
): Column[] => [
    {
        Header: formatMessage(MESSAGES.name),
        id: 'form_version__form__name',
        accessor: (row: MappingVersionRow) => row.form_version.form.name,
        align: 'left',
    },
    {
        Header: formatMessage(MESSAGES.version),
        id: 'form_version__version_id',
        accessor: (row: MappingVersionRow) => row.form_version.version_id,
    },

    {
        Header: formatMessage(MESSAGES.type),
        id: 'mapping__mapping_type',
        accessor: (row: MappingVersionRow) => row.mapping.mapping_type,
    },
    {
        Header: formatMessage(MESSAGES.mappedQuestions),
        sortable: false,
        accessor: 'mapped_questions',
    },
    {
        Header: formatMessage(MESSAGES.totalQuestions),
        sortable: false,
        accessor: 'total_questions',
    },
    {
        Header: formatMessage(MESSAGES.coverage),
        accessor: 'coverage',
        sortable: false,
        Cell: (settings: ColumnCell<MappingVersionRow>) =>
            safePercent(
                settings.row.original.mapped_questions,
                settings.row.original.total_questions,
            ),
    },

    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: (settings: ColumnCell<MappingVersionRow>) => (
            <section>
                <IconButtonComponent
                    url={`/${baseUrls.mappingDetail}/mappingVersionId/${settings.row.original.id}`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.view}
                />
            </section>
        ),
    },
];
