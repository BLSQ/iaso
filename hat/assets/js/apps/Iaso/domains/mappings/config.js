import React from 'react';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';

const safePercent = (a, b) => {
    if (b === 0) {
        return '-';
    }
    return (100 * (a / b)).toFixed(2);
};

const mappingsTableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => (
            <section>
                <IconButtonComponent
                    url={`${baseUrls.mappingDetail}/mappingVersionId/${settings.cell.row.original.id}`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.view}
                />
            </section>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'form_version__form__name',
        style: { justifyContent: 'left' },
        Cell: settings => (
            <span>{settings.cell.row.original.form_version.form.name}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.version),
        accessor: 'form_version__version_id',
        Cell: settings => (
            <span>{settings.cell.row.original.form_version.version_id}</span>
        ),
    },

    {
        Header: formatMessage(MESSAGES.type),
        accessor: 'mapping__mapping_type',
        Cell: settings => (
            <span>{settings.cell.row.original.mapping.mapping_type}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.mappedQuestions),
        accessor: 'mapped_questions',
        Cell: settings => (
            <span>{settings.cell.row.original.mapped_questions}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.totalQuestions),
        accessor: 'total_questions',
        Cell: settings => (
            <span>{settings.cell.row.original.total_questions}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.coverage),
        accessor: 'coverage',
        Cell: settings => (
            <span>
                {safePercent(
                    settings.cell.row.original.mapped_questions,
                    settings.cell.row.original.total_questions,
                )}
            </span>
        ),
    },

    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(
                    settings.cell.row.original.updated_at,
                )}
            </span>
        ),
    },
];
export default mappingsTableColumns;
