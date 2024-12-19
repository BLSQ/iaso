import { Column, useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DocumentsCells } from '../../components/DocumentsCell';
import MESSAGES from '../../messages';

export const useVaccineRepositoryReportsColumns = (
    params: Record<string, any>,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { reportFileType } = params;
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country__name',
                accessor: 'country_name',
                align: 'left',
            },
            {
                Header: formatMessage(MESSAGES.vaccine),
                id: 'vaccine',
                accessor: 'vaccine',
                width: 20,
            },
        ];

        if (reportFileType !== 'DESTRUCTION') {
            columns.push({
                Header: formatMessage(MESSAGES.incidentReports),
                accessor: 'incident_report_data',
                Cell: DocumentsCells,
                sortable: false,
            });
        }
        if (reportFileType !== 'INCIDENT') {
            columns.push({
                Header: formatMessage(MESSAGES.destructionReports),
                accessor: 'destruction_report_data',
                Cell: DocumentsCells,
                sortable: false,
            });
        }
        return columns;
    }, [reportFileType, formatMessage]);
};
