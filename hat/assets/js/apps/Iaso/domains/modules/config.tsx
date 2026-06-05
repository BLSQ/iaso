import React, { ReactElement, useMemo } from 'react';
import {
    HighlightOffOutlined as NotCheckedIcon,
    CheckCircleOutlineOutlined as CheckedIcon,
} from '@mui/icons-material';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from './messages';

export const useModulesColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                id: 'name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                resizable: false,
                sortable: false,
                Cell: (settings): ReactElement => {
                    if (settings.row.original?.is_activated_for_user) {
                        return (
                            <CheckedIcon
                                style={{ color: 'green' }}
                                aria-label={formatMessage(MESSAGES.activated)}
                            />
                        );
                    }
                    return (
                        <NotCheckedIcon
                            color="disabled"
                            aria-label={formatMessage(MESSAGES.notActivated)}
                        />
                    );
                },
            },
        ];
    }, [formatMessage]);
};
