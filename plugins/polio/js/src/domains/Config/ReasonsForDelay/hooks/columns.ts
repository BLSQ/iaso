import { Column, useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import MESSAGES from '../messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

export const useReasonsForDelayColumns = (): Column[] => {
    // @ts-ignore
    const activeLocale = useSelector(state => state.app.locale);
    const { code: locale } = activeLocale;
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: 'Id',
                accessor: 'id',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.keyName),
                accessor: 'key_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.name_en),
                accessor: 'name_en',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.name_fr),
                accessor: 'name_fr',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.createdAt),
                accessor: 'created_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.timesSelected),
                accessor: 'times_selected',
                sortable: false,
            },
        ];
    }, [formatMessage]);
};
