import React, { ReactElement, useMemo } from 'react';
import { Link } from 'react-router';
import { useSafeIntl, IconButton, Column } from 'bluesquare-components';
import GetAppIcon from '@material-ui/icons/GetApp';

import MESSAGES from '../messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { useDeleteAttachment } from '../hooks/useDeleteAttachment';

export const useGetColumns = (params, count): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteAttachment } = useDeleteAttachment(
        params,
        count,
    );
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
            },
            {
                Header: 'MD5',
                accessor: 'md5',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: (settings: any): ReactElement => {
                    return (
                        <>
                            <Link href={settings.row.original.file} download>
                                <IconButton
                                    onClick={() => null}
                                    tooltipMessage={MESSAGES.download}
                                    overrideIcon={GetAppIcon}
                                />
                            </Link>
                            <DeleteDialog
                                titleMessage={{
                                    ...MESSAGES.deleteAttachment,
                                    values: {
                                        attachmentName:
                                            settings.row.original.name,
                                    },
                                }}
                                message={{
                                    ...MESSAGES.deleteWarning,
                                    values: {
                                        name: settings.row.original.name,
                                    },
                                }}
                                onConfirm={() =>
                                    deleteAttachment(settings.row.original.id)
                                }
                            />
                        </>
                    );
                },
            },
        ],
        [deleteAttachment, formatMessage],
    );
};
