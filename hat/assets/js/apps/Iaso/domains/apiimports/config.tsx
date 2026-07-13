import React, { useMemo } from 'react';
import { Done } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';

import { baseUrls } from 'Iaso/constants/urls';
import { APIImportModal } from 'Iaso/domains/apiimports/components/APIImportModal';
import { textOrPlaceholder } from 'Iaso/domains/apiimports/utils';
import getDisplayName from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';

export const baseUrl = baseUrls.adminApiImport;

export const useColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.is_successful),
                id: 'has_problem',
                accessor: 'has_problem',
                Cell: settings => {
                    const { has_problem } = settings.row.original;
                    if (has_problem) {
                        return <CloseIcon color="error" />;
                    }
                    return <Done color="success" />;
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.user),
                id: 'user',
                accessor: 'user',
                Cell: settings => {
                    const { user } = settings.row.original;
                    return getDisplayName(user);
                },
            },
            {
                Header: formatMessage(MESSAGES.import_type),
                id: 'import_type',
                accessor: 'import_type',
            },
            {
                Header: formatMessage(MESSAGES.app_id),
                id: 'app_id',
                accessor: 'app_id',
                Cell: settings => {
                    const { app_id } = settings.row.original;
                    return textOrPlaceholder(app_id);
                },
            },
            {
                Header: formatMessage(MESSAGES.app_version),
                id: 'app_version',
                accessor: 'app_version',
                Cell: settings => {
                    const { app_version } = settings.row.original;
                    return textOrPlaceholder(app_version);
                },
            },
            {
                id: 'actions',
                Cell: settings => {
                    const apiImport = settings.row.original;
                    return <APIImportModal apiImport={apiImport} />;
                },
            },
        ],
        [formatMessage],
    );
};
