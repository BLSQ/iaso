import React, { ReactElement, ReactNode, useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { EditPredefinedFilterModal } from 'Iaso/domains/forms/components/PredefinedFilterModal';
import { useDeletePredefinedFilter } from 'Iaso/domains/forms/hooks/useDeletePredefinedFilter';
import {
    FormParams,
    FormPredefinedFilter,
} from 'Iaso/domains/forms/types/forms';
import { useHumanReadableJsonLogicForForm } from 'Iaso/domains/workflows/hooks/useHumanReadableJsonLogicForForm';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from '../messages';

export const useGetColumns = (
    params: FormParams,
    count: number,
    save: (filter: FormPredefinedFilter) => void,
    isSaving: boolean,
    getHumanReadableJsonLogic: (
        logic: Record<string, string>,
    ) => string | ReactNode,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deletePredefinedFilter } = useDeletePredefinedFilter(
        params,
        count,
    );
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.short_name),
                accessor: 'short_name',
            },
            {
                Header: formatMessage(MESSAGES.json_logic),
                sortable: false,
                accessor: 'json_logic',
                Cell: jsonLogic => {
                    return <>{getHumanReadableJsonLogic(jsonLogic.value)}</>;
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: (settings: any): ReactElement => {
                    return (
                        <>
                            <EditPredefinedFilterModal
                                iconProps={{}}
                                save={save}
                                isSaving={isSaving}
                                form_id={params.formId}
                                id={settings.row.original.id}
                                predefinedFilter={settings.row.original}
                            />
                            <DeleteDialog
                                titleMessage={{
                                    ...MESSAGES.deletePredefinedFilter,
                                    values: {
                                        name: settings.row.original.name,
                                    },
                                }}
                                message={{
                                    ...MESSAGES.deleteWarning,
                                    values: {
                                        name: settings.row.original.name,
                                    },
                                }}
                                onConfirm={() =>
                                    deletePredefinedFilter(
                                        settings.row.original.id,
                                    )
                                }
                            />
                        </>
                    );
                },
            },
        ],
        [
            deletePredefinedFilter,
            formatMessage,
            getHumanReadableJsonLogic,
            isSaving,
            params.formId,
            save,
        ],
    );
};
