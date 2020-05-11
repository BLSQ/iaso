/* globals window */
import React from 'react';
import orderBy from 'lodash/orderBy';

import ColumnTextComponent from '../../components/tables/ColumnTextComponent';
import RowButtonComponent from '../../components/buttons/RowButtonComponent';

import { baseUrls } from '../../constants/urls';
import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

const instancesTableColumns = (formatMessage = () => ({})) => {
    const columns = [
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            width: 150,
            Cell: settings => (
                <section>
                    <RowButtonComponent
                        url={`${baseUrls.instanceDetail}/instanceId/${settings.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={{ id: 'iaso.label.view', defaultMessage: 'View' }}
                    />
                    <RowButtonComponent
                        onClick={() => window.open(settings.original.file_url, '_blank')}
                        icon="xml"
                        tooltipMessage={{ id: 'iaso.label.downloadXml', defaultMessage: 'Download XML' }}
                    />
                </section>
            ),
        },
    ];
    let metaFields = INSTANCE_METAS_FIELDS.filter(f => Boolean(f.tableOrder));
    metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
    metaFields.forEach(f => columns.push({
        Header: formatMessage(MESSAGES[f.key]),
        accessor: f.accessor || f.key,
        Cell: settings => (
            <ColumnTextComponent
                title={f.title ? f.title(settings.original[f.key]) : null}
                text={f.render ? f.render(settings.original[f.key]) : settings.original[f.key]}
            />
        ),
    }));
    return columns;
};

export default instancesTableColumns;
