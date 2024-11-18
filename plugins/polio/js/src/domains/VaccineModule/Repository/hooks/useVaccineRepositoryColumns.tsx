import { Column, useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../messages';
import { DocumentsCells } from '../components/DocumentsCell';
import { VrfDocumentsCells } from '../components/VrfDocumentsCell';
import { FormADocumentsCells } from '../components/FormADocumentCells';

export const useVaccineRepositoryColumns = (): Column[] => {
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
                Header: formatMessage(MESSAGES.roundNumbers),
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
                Cell: VrfDocumentsCells,
            },
            {
                Header: 'Pre Alert',
                accessor: 'pre_alert_data',
                Cell: DocumentsCells,
            },
            {
                Header: 'Form A',
                accessor: 'form_a_data',
                Cell: FormADocumentsCells,
            },
        ],
        [formatMessage],
    );
};
