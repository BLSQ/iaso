import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { DateTimeCell } from '../../components/Cells/DateTimeCell.tsx';
import { NumberCell } from '../../components/Cells/NumberCell.tsx';

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
                    url={`${baseUrls.mappingDetail}/mappingVersionId/${settings.row.original.id}`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.view}
                />
            </section>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        id: 'form_version__form__name',
        accessor: row => row.form_version.form.name,
        align: 'left',
    },
    {
        Header: formatMessage(MESSAGES.version),
        id: 'form_version__version_id',
        accessor: row => row.form_version.version_id,
    },

    {
        Header: formatMessage(MESSAGES.type),
        id: 'mapping__mapping_type',
        accessor: row => row.mapping.mapping_type,
    },
    {
        Header: formatMessage(MESSAGES.mappedQuestions),
        sortable: false,
        accessor: 'mapped_questions',
        Cell: settings => (
            <NumberCell value={settings.row.original.mapped_questions} />
        ),
    },
    {
        Header: formatMessage(MESSAGES.totalQuestions),
        sortable: false,
        accessor: 'total_questions',
        Cell: settings => (
            <NumberCell value={settings.row.original.total_questions} />
        ),
    },
    {
        Header: formatMessage(MESSAGES.coverage),
        accessor: 'coverage',
        sortable: false,
        Cell: settings => (
            <NumberCell
                value={safePercent(
                    settings.row.original.mapped_questions,
                    settings.row.original.total_questions,
                )}
            />
        ),
    },

    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
];
export default mappingsTableColumns;
