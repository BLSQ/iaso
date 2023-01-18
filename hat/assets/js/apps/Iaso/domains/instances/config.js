import React from 'react';
import orderBy from 'lodash/orderBy';

import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';
import ActionTableColumnComponent from './components/ActionTableColumnComponent';

export const actionTableColumn = (formatMessage = () => ({}), user) => {
    return {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => (
            <ActionTableColumnComponent settings={settings} user={user} />
        ),
    };
};

const instancesTableColumns = (formatMessage = () => ({})) => {
    const columns = [];
    let metaFields = INSTANCE_METAS_FIELDS.filter(f => Boolean(f.tableOrder));
    metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
    metaFields.forEach(f =>
        columns.push({
            Header: formatMessage(MESSAGES[f.key]),
            accessor: f.accessor || f.key,
            sortable: f.sortable !== false,
            Cell:
                f.Cell ||
                (settings =>
                    f.render
                        ? f.render(settings.row.original[f.key])
                        : settings.row.original[f.key]),
        }),
    );
    return columns;
};

export default instancesTableColumns;
