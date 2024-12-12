import { Column, useSafeIntl } from 'bluesquare-components';
import React, { useMemo } from 'react';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DocumentsCells } from '../../components/DocumentsCell';
import { FormADocumentsCells } from '../../components/FormADocumentCells';
import { VrfDocumentsCells } from '../../components/VrfDocumentsCell';
import MESSAGES from '../../messages';

export const useVaccineRepositoryColumns = (
    params: Record<string, any>,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { file_type } = params;
    // wrong typing in our library
    // @ts-ignore
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.country),
                id: 'campaign__country__name',
                accessor: 'country_name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.obr_name),
                id: 'campaign__obr_name',
                accessor: 'campaign_obr_name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.roundNumbers),
                id: 'number',
                accessor: 'number',
                width: 20,
                Cell: settings => (
                    <span>{`${settings.row.original.number}`}</span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.vaccine),
                id: 'vaccine_name',
                accessor: 'vaccine_name',
                width: 20,
            },
            {
                Header: formatMessage(MESSAGES.startDate),
                id: 'started_at',
                accessor: 'start_date',
                Cell: DateCell,
                width: 30,
            },
        ];
        if (
            !file_type ||
            file_type === 'VRF' ||
            file_type === 'VRF,PRE_ALERT,FORM_A'
        ) {
            columns.push({
                Header: 'VRF',
                accessor: 'vrf_data',
                Cell: VrfDocumentsCells,
                width: 30,
                // wrong typing in our library
                // @ts-ignore
                sortable: false,
            });
        }
        if (
            !file_type ||
            file_type === 'PRE_ALERT' ||
            file_type === 'VRF,PRE_ALERT,FORM_A'
        ) {
            columns.push({
                Header: 'Pre Alert',
                accessor: 'pre_alert_data',
                Cell: DocumentsCells,
                width: 30,
                // wrong typing in our library
                // @ts-ignore
                sortable: false,
            });
        }
        if (
            !file_type ||
            file_type === 'FORM_A' ||
            file_type === 'VRF,PRE_ALERT,FORM_A'
        ) {
            columns.push({
                Header: 'Form A',
                accessor: 'form_a_data',
                Cell: FormADocumentsCells,
                width: 20,
                // wrong typing in our library
                // @ts-ignore
                sortable: false,
            });
        }
        return columns;
    }, [file_type, formatMessage]);
};
