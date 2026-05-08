import React, { useMemo } from 'react';
import { Done } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';

import { baseUrls } from 'Iaso/constants/urls';
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
                    if (user.first_name && user.last_name) {
                        return (
                            user.first_name +
                            ' ' +
                            user.last_name +
                            ' (' +
                            user.username +
                            ')'
                        );
                    }
                    return user.username;
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
            },
            {
                Header: formatMessage(MESSAGES.app_version),
                id: 'app_version',
                accessor: 'app_version',
            },
            {
                Header: formatMessage(MESSAGES.json_body),
                id: 'json_body',
                accessor: 'json_body',
                Cell: settings => {
                    const { json_body } = settings.row.original;
                    return (
                        <pre style={{ textAlign: 'start' }}>
                            {JSON.stringify(json_body, null, 2)}
                        </pre>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.headers),
                id: 'headers',
                accessor: 'headers',
                Cell: settings => {
                    const { headers } = settings.row.original;
                    if (headers == null) {
                        return textPlaceholder;
                    }
                    return (
                        <pre style={{ textAlign: 'start' }}>
                            {JSON.stringify(headers, null, 2)}
                        </pre>
                    );
                },
            },
        ],
        [formatMessage],
    );
};
