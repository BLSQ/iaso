import { Column, useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DocumentsCells } from '../../components/DocumentsCell';
import MESSAGES from '../../messages';

export const useVaccineRepositoryReportsColumns = (): Column[] => {
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
                Header: formatMessage(MESSAGES.vaccine),
                id: 'vaccine',
                accessor: 'vaccine',
                width: 20,
            },
            {
                Header: 'IR',
                accessor: 'incident_report_data',
                Cell: DocumentsCells,
            },
            {
                Header: 'DR',
                accessor: 'destruction_report_data',
                Cell: DocumentsCells,
            },
        ],
        [formatMessage],
    );
};
