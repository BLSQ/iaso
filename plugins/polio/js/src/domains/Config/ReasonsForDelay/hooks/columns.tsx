import React, { ReactElement, useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { useAppLocales } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/app/constants';
import { EditReasonForDelay } from '../CreateEdit/CreateEditReasonForDelay';
import MESSAGES from '../messages';

export const useReasonsForDelayColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const appLocales = useAppLocales();
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
            ...appLocales.map(locale => {
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
