import React, { useMemo } from 'react';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { YesNoCell } from '../../components/Cells/YesNoCell';
import { FormsCell } from './components/FormsCell';
import { OrgUnitsCell } from './components/OrgUnitsCell';

export const useDevicesTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.id),
                sortable: false,
                accessor: 'imei',
            },
            {
                Header: formatMessage(MESSAGES.test_device),
                sortable: false,
                accessor: 'test_device',
                Cell: YesNoCell,
            },
            {
                Header: formatMessage(MESSAGES.last_owner),
                sortable: false,
                accessor: 'last_owner',
                Cell: settings =>
                    settings.value
                        ? `${settings.value.first_name} ${settings.value.last_name} ${settings.value.user_name}`
                        : textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.formsImported),
                sortable: false,
                accessor: 'forms_imported',
                Cell: FormsCell,
            },
            {
                Header: formatMessage(MESSAGES.orgUnitsVisited),
                sortable: false,
                accessor: 'org_units_visited',
                Cell: OrgUnitsCell,
            },
            {
                Header: formatMessage(MESSAGES.timeSynched),
                sortable: false,
                accessor: 'synched_at',
                Cell: DateTimeCell,
            },
            // {
            //     Header: formatMessage(MESSAGES.timeCreated),
            //     sortable: false,
            //     accessor: 'created_at',
            //     Cell: DateTimeCell,
            // },
            // {
            //     Header: formatMessage(MESSAGES.timeUpdated),
            //     sortable: false,
            //     accessor: 'updated_at',
            //     Cell: DateTimeCell,
            // },
            {
                Header: formatMessage(MESSAGES.firstUse),
                sortable: false,
                accessor: 'first_use',
                Cell: DateTimeCell,
            },
        ],
        [formatMessage],
    );
};
