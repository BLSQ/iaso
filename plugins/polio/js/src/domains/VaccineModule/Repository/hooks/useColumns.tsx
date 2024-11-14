import { Column, useSafeIntl } from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { PdfPreview } from '../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/PdfPreview';
import MESSAGES from '../messages';
import { DocumentData } from './useGetVaccineReporting';

export const DocumentsCell = (cellInfo: {
    value?: DocumentData[];
}): ReactElement => {
    const value = cellInfo?.value ?? [];
    console.log(value);
    return (
        <>
            {value.map(
                ({ date, file }) =>
                    date && file && <PdfPreview key={file} pdfUrl={file} />,
            )}
        </>
    );
};
export const useColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country_name',
                accessor: 'country_name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.obr_name),
                id: 'campaign_obr_name',
                accessor: 'campaign_obr_name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.roundCount),
                id: 'rounds_count',
                accessor: 'rounds_count',
            },
            {
                Header: formatMessage(MESSAGES.startDate),
                accessor: 'start_date',
                Cell: DateCell,
            },
            {
                Header: 'VRF',
                accessor: 'vrf_data',
                Cell: DocumentsCell,
            },
            {
                Header: 'Pre Alert',
                accessor: 'pre_alert_data',
                Cell: DocumentsCell,
            },
            {
                Header: 'VRF',
                accessor: 'form_a_data',
                Cell: DocumentsCell,
            },
            {
                Header: 'incident_reports',
                accessor: 'incident_reports',
                Cell: DocumentsCell,
            },
            {
                Header: 'destruction_reports',
                accessor: 'destruction_reports',
                Cell: DocumentsCell,
            },
        ],
        [formatMessage],
    );
};
