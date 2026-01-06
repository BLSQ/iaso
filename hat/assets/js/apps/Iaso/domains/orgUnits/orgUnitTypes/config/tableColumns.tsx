import React from 'react';
import {
    IconButton,
    formatThousand,
    useSafeIntl,
    Column,
} from 'bluesquare-components';
import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { baseUrls } from '../../../../constants/urls';
import { OrgUnitsTypesDialog } from '../components/OrgUnitsTypesDialog';
import { useDeleteOrgUnitType } from '../hooks/useDeleteOrgUnitType';
import MESSAGES from '../messages';

export const baseUrl = baseUrls.orgUnitTypes;

export const useGetColumns = (params: any, count: number): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteType } = useDeleteOrgUnitType({ params, count });
    return [
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            align: 'left',
        },
        {
            Header: formatMessage(MESSAGES.projects),
            accessor: 'projects',
            width: 300,
            Cell: settings => <ProjectChips projects={settings.value} />,
        },
        {
            Header: formatMessage(MESSAGES.subUnitTypes),
            accessor: 'sub_unit_types',
            Cell: settings =>
                settings.value?.map(subType => subType.name).join(','),
        },
        {
            Header: formatMessage(MESSAGES.shortName),
            accessor: 'short_name',
        },
        {
            Header: formatMessage(MESSAGES.orgUnitCount),
            accessor: 'units_count',
            sortable: false,
            Cell: settings => formatThousand(settings.value),
        },
        {
            Header: formatMessage(MESSAGES.depth),
            headerInfo: formatMessage(MESSAGES.depthInfos),
            sortable: true,
            accessor: 'depth',
        },
        {
            Header: formatMessage(MESSAGES.createdAt),
            accessor: 'created_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.updatedAt),
            accessor: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: settings => (
                <section>
                    <OrgUnitsTypesDialog
                        renderTrigger={({ openDialog }) => (
                            <IconButton
                                onClick={openDialog}
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                id={`edit-button-${settings.row.original.id}`}
                            />
                        )}
                        orgUnitType={settings.row.original}
                        titleMessage={MESSAGES.update}
                        key={settings.row.original.updated_at}
                    />
                    <DeleteDialog
                        keyName={settings.row.original.id.toString()}
                        disabled={
                            parseInt(settings.row.original.units_count, 10) > 0
                        }
                        titleMessage={MESSAGES.delete}
                        message={MESSAGES.deleteWarning}
                        onConfirm={() => {
                            deleteType(settings.row.original.id);
                        }}
                    />
                </section>
            ),
        },
    ];
};
