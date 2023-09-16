import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import {
    HighlightOffOutlined as NotCheckedIcon,
    CheckCircleOutlineOutlined as CheckedIcon,
} from '@material-ui/icons';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import MESSAGES from './messages';

export const useGetModulesColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                id: 'name',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                id: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                id: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.status),
                resizable: false,
                sortable: false,
                Cell: (settings): ReactElement => {
                    const { account } = settings.row.original;
                    if (account.length > 0) {
                        return <CheckedIcon style={{ color: 'green' }} />;
                    }
                    return <NotCheckedIcon color="disabled" />;
                },
            },
        ];
        return columns;
    }, [formatMessage]);
};
