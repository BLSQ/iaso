import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import { DateCell } from '../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

import MESSAGES from '../messages';
import { DeleteNotificationModal } from '../Modals/NotificationsDeleteModal';
import { DropdownsContent } from '../types';
import { EditNotificationModal } from '../Modals/NotificationsCreateEditModal';

export const useNotificationsTableColumns = (
    dropdownContent: DropdownsContent,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.labelId),
                id: 'id',
                accessor: 'id',
            },
            {
                Header: formatMessage(MESSAGES.labelEpid),
                id: 'epid_number',
                accessor: 'epid_number',
            },
            {
                Header: formatMessage(MESSAGES.labelVdpvCategory),
                id: 'vdpv_category',
                accessor: 'get_vdpv_category_display',
            },
            {
                Header: formatMessage(MESSAGES.labelSource),
                id: 'source',
                accessor: 'get_source_display',
            },
            {
                Header: formatMessage(MESSAGES.labelVdpvNucleotideDiffSabin2),
                id: 'vdpv_nucleotide_diff_sabin2',
                accessor: 'vdpv_nucleotide_diff_sabin2',
            },
            {
                Header: formatMessage(MESSAGES.labelCountry),
                id: 'country',
                accessor: 'country',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelProvince),
                id: 'province',
                accessor: 'province',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelDistrict),
                id: 'district',
                accessor: 'district',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelSiteName),
                id: 'site_name',
                accessor: 'site_name',
            },
            {
                Header: formatMessage(MESSAGES.labelLineage),
                id: 'lineage',
                accessor: 'lineage',
            },
            {
                Header: formatMessage(MESSAGES.labelDateOfOnset),
                id: 'date_of_onset',
                accessor: 'date_of_onset',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.labelClosestMatchVdpv2),
                id: 'closest_match_vdpv2',
                accessor: 'closest_match_vdpv2',
            },
            {
                Header: formatMessage(MESSAGES.labelDateResultsReceived),
                id: 'date_results_received',
                accessor: 'date_results_received',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.labelActions),
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            {/* @ts-ignore */}
                            <EditNotificationModal
                                dropdownContent={dropdownContent}
                                notification={settings.row.original}
                            />
                            {/* @ts-ignore */}
                            <DeleteNotificationModal
                                notification={settings.row.original}
                            />
                        </>
                    );
                },
            },
        ];
    }, [formatMessage]);
};
