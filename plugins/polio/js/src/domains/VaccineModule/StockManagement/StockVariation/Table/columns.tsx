import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

export const useFormATableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'action',
                id: 'action',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.forma_reception_rrt),
                accessor: 'forma_reception_rrt',
                id: 'forma_reception_rrt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.date_of_report),
                accessor: 'date_of_report',
                id: 'date_of_report',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.lot_numbers_for_usable_vials),
                accessor: 'lot_numbers_for_usable_vials',
                id: 'lot_numbers_for_usable_vials',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.forma_unusable_vials),
                accessor: 'unusable_vials',
                id: 'unusable_vials',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.forma_vials_missing),
                accessor: 'vials_missing',
                id: 'vials_missing',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.forma_vials_used),
                accessor: 'vials_used',
                id: 'vials_used',
                sortable: true,
            },
        ];
    }, [formatMessage]);
};
export const useDestructionTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'action',
                id: 'action',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.destruction_reception_rrt),
                accessor: 'destruction_reception_rrt',
                id: 'destruction_reception_rrt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.date_of_report),
                accessor: 'date_of_report',
                id: 'date_of_report',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.vials_destroyed),
                accessor: 'vials_destroyed',
                id: 'vials_destroyed',
                sortable: true,
            },
        ];
    }, [formatMessage]);
};
export const useIncidentTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'action',
                id: 'action',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.incident_reception_rrt),
                accessor: 'incident_reception_rrt',
                id: 'incident_reception_rrt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.usable_vials),
                accessor: 'usable_vials',
                id: 'usable_vials',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.unusable_vials),
                accessor: 'unusable_vials',
                id: 'unusable_vials',
                sortable: true,
            },
        ];
    }, [formatMessage]);
};
