import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import {
    HighlightOffOutlined as NotCheckedIcon,
    CheckCircleOutlineOutlined as CheckedIcon,
} from '@mui/icons-material';
import MESSAGES from './messages';

export const useGetModulesColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                id: 'name',
                Cell: settings => {
                    return formatMessage(
                        MESSAGES[settings.row.original.codename.toLowerCase()],
                    );
                },
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
    }, [formatMessage]);
};
