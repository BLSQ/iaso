import { Column, useSafeIntl } from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import { APP_LOCALES } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/constants';
import MESSAGES from '../messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { EditReasonForDelay } from '../CreateEdit/CreateEditReasonForDelay';

export const useReasonsForDelayColumns = (): Column[] => {
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
            ...APP_LOCALES.map(locale => {
                const key = `name_${locale.code}`;
                return {
                    Header: formatMessage(MESSAGES[key]),
                    accessor: key,
                    sortable: true,
                };
            }),
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
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: (settings): ReactElement => {
                    return (
                        <EditReasonForDelay
                            iconProps={{}}
                            id={settings.row.original.id}
                            keyName={settings.row.original.key_name}
                            nameEn={settings.row.original.name_en}
                            nameFr={settings.row.original.name_fr}
                        />
                    );
                },
            },
        ];
    }, [formatMessage]);
};
