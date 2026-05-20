import { useMemo } from 'react';
import { ColumnWithAccessor, useSafeIntl } from 'bluesquare-components';
import orderBy from 'lodash/orderBy';
import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

export const useInstancesTableColumns = () => {
    const { formatNullishMessage } = useSafeIntl();
    return useMemo(() => {
        const columns: Array<
            ColumnWithAccessor & { sortable?: boolean; align?: string }
        > = [];
        let metaFields = INSTANCE_METAS_FIELDS.filter(f =>
            Boolean(f.tableOrder),
        );
        metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
        metaFields.forEach(f => {
            columns.push({
                Header: formatNullishMessage(f.key, MESSAGES),
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
    }, [formatNullishMessage]);
};
