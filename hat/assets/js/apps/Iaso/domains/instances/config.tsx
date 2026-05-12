import { ColumnWithAccessor, IntlMessage } from 'bluesquare-components';
import orderBy from 'lodash/orderBy';

import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

const instancesTableColumns = (
    formatMessage: (
        key: string,
        messages: Record<string, IntlMessage>,
        values?: any,
    ) => string,
) => {
    const columns: Array<
        ColumnWithAccessor & { sortable?: boolean; align?: string }
    > = [];
    let metaFields = INSTANCE_METAS_FIELDS.filter(f => Boolean(f.tableOrder));
    metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
    metaFields.forEach(f => {
        columns.push({
            Header: formatMessage(f.key, MESSAGES),
            accessor: f.accessor || f.key,
            sortable: f.sortable !== false,
            align: 'center',
            Cell:
                f.Cell ||
                (settings =>
                    f.render
                        ? f.render(settings.row.original[f.key])
                        : settings.row.original[f.key]),
        });
    });
    return columns;
};

export default instancesTableColumns;
