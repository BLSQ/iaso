import orderBy from 'lodash/orderBy';

import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

const instancesTableColumns = (formatMessage = () => ({})) => {
    const columns = [];
    let metaFields = INSTANCE_METAS_FIELDS.filter(f => Boolean(f.tableOrder));
    metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
    metaFields.forEach(f => {
        columns.push({
            Header: formatMessage(MESSAGES[f.key]) ?? f.key,
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
