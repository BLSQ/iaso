import React, { ReactElement, useMemo } from 'react';
import {
    Column,
    useSafeIntl,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { convertToDate } from '../../components/Cells/DateTimeCell';
import { MESSAGES } from './messages';

export const useColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: 'Id',
                accessor: 'id',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.createdAt),
                accessor: 'createdAt',
                Cell: (cellInfo: { value?: string | null }): string =>
                    convertToDate(cellInfo?.value),
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                Cell: (cellInfo: {
                    row: { original: { id: number } };
                }): ReactElement => {
                    return (
                        <IconButtonComponent
                            url={`/${baseUrls.pipelineDetails}/pipelineId/${cellInfo.row.original.id}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.see}
                        />
                    );
                },
                sortable: false,
            },
        ];
    }, [formatMessage]);
};
