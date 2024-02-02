/* eslint-disable camelcase */
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
                accessor: 'report_date',
                id: 'report_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                // Not formatting lot numbers as it's not clear how they will be formatted
                Header: formatMessage(MESSAGES.lot_numbers_for_usable_vials),
                accessor: 'lot_numbers',
                id: 'lot_numbers',
                sortable: true,
                Cell: settings => {
                    const { lot_numbers } = settings.row.original;
                    if ((lot_numbers ?? []).length === 0) {
                        return <span>{textPlaceholder}</span>;
                    }
                    return (
                        <>
                            {lot_numbers.map((lotNumber, index) => (
                                <div key={`${lotNumber}-${index}`}>
                                    {lotNumber ?? textPlaceholder}
                                </div>
                            ))}
                        </>
                    );
                },
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
                accessor: 'missing_vials',
                id: 'missing_vials',
                sortable: true,
                Cell: settings => {
                    if (settings.row.original.missing_vials) {
                        return (
                            <NumberCell
                                value={settings.row.original.missing_vials}
                            />
                        );
                    }
                    return textPlaceholder;
                },
            },
            {
                Header: formatMessage(MESSAGES.forma_vials_used),
                accessor: 'usable_vials_used',
                id: 'usable_vials_used',
                sortable: true,
                Cell: settings => {
                    if (settings.row.original.usable_vials_used) {
                        return (
                            <NumberCell
                                value={settings.row.original.usable_vials_used}
                            />
                        );
                    }
                    return textPlaceholder;
                },
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
                                vaccineStockId={
                                    settings.row.original.vaccine_stock
                                }
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
                Header: formatMessage(
                    MESSAGES.rrt_destruction_report_reception_date,
                ),
                accessor: 'rrt_destruction_report_reception_date',
                id: 'rrt_destruction_report_reception_date',
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
                                vaccineStockId={
                                    settings.row.original.vaccine_stock
                                }
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
                                vaccineStockId={
                                    settings.row.original.vaccine_stock
                                }
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
