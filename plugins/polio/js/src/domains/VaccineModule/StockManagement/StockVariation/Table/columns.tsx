import React, { useMemo } from 'react';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import MESSAGES from '../../messages';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
// import DeleteDialog from '../../../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { EditFormA } from '../Modals/CreateEditFormA';
import { Vaccine } from '../../../../../constants/types';
import { EditDestruction } from '../Modals/CreateEditDestruction';
import { EditIncident } from '../Modals/CreateEditIncident';

export const useFormATableColumns = (
    countryName: string,
    vaccine: Vaccine,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.campaign),
                accessor: 'campaign',
                id: 'campaign',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.form_a_reception_date),
                accessor: 'form_a_reception_date',
                id: 'form_a_reception_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.report_date),
                accessor: 'date_of_report',
                id: 'date_of_report',
                sortable: true,
                Cell: DateCell,
            },
            {
                // Not formatting lot numbers as it's not clear how they will be formatted
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
                Cell: settings => (
                    <NumberCell value={settings.row.original.unusable_vials} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.forma_vials_missing),
                accessor: 'vials_missing',
                id: 'vials_missing',
                sortable: true,
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_missing} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.forma_vials_used),
                accessor: 'vials_used',
                id: 'vials_used',
                sortable: true,
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_used} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <EditFormA
                                id={settings.row.original.id}
                                formA={settings.row.original}
                                iconProps={{}}
                                countryName={countryName}
                                vaccine={vaccine}
                            />
                            {/* <DeleteDialog
                                titleMessage={MESSAGES.deleteVRF}
                                message={MESSAGES.deleteVRFWarning}
                                onConfirm={() =>
                                    deleteVrf(settings.row.original.id)
                                }
                            /> */}
                        </>
                    );
                },
            },
        ];
    }, [countryName, formatMessage, vaccine]);
};
export const useDestructionTableColumns = (
    countryName: string,
    vaccine: Vaccine,
): Column[] => {
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
                Header: formatMessage(MESSAGES.report_date),
                accessor: 'destruction_report_date',
                id: 'destruction_report_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.vials_destroyed),
                accessor: 'unusable_vials_destroyed',
                id: 'unusable_vials_destroyed',
                sortable: true,
                Cell: settings => (
                    <NumberCell
                        value={settings.row.original.unusable_vials_destroyed}
                    />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <EditDestruction
                                id={settings.row.original.id}
                                destruction={settings.row.original}
                                iconProps={{}}
                                countryName={countryName}
                                vaccine={vaccine}
                            />
                            {/* <DeleteDialog
                                titleMessage={MESSAGES.deleteVRF}
                                message={MESSAGES.deleteVRFWarning}
                                onConfirm={() =>
                                    deleteVrf(settings.row.original.id)
                                }
                            /> */}
                        </>
                    );
                },
            },
        ];
    }, [countryName, formatMessage, vaccine]);
};
export const useIncidentTableColumns = (
    countryName: string,
    vaccine: Vaccine,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.stockCorrection),
                accessor: 'stock_correction',
                id: 'stock_correction',
                sortable: true,
                Cell: settings =>
                    settings.row.original.stock_correction
                        ? formatMessage(
                              MESSAGES[settings.row.original.stock_correction],
                          )
                        : textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.incident_report_received_by_rrt),
                accessor: 'incident_report_received_by_rrt',
                id: 'incident_report_received_by_rrt',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.report_date),
                accessor: 'date_of_incident_report',
                id: 'date_of_incident_report',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.usable_vials),
                accessor: 'usable_vials',
                id: 'usable_vials',
                sortable: true,
                Cell: settings => (
                    <NumberCell value={settings.row.original.usable_vials} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.unusable_vials),
                accessor: 'unusable_vials',
                id: 'unusable_vials',
                sortable: true,
                Cell: settings => (
                    <NumberCell value={settings.row.original.unusable_vials} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <EditIncident
                                id={settings.row.original.id}
                                incident={settings.row.original}
                                iconProps={{}}
                                countryName={countryName}
                                vaccine={vaccine}
                            />
                            {/* <DeleteDialog
                                titleMessage={MESSAGES.deleteVRF}
                                message={MESSAGES.deleteVRFWarning}
                                onConfirm={() =>
                                    deleteVrf(settings.row.original.id)
                                }
                            /> */}
                        </>
                    );
                },
            },
        ];
    }, [countryName, formatMessage, vaccine]);
};
