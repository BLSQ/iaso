import React from 'react';
import { formatThousand, useSafeIntl, Column } from 'bluesquare-components';
import {
    PaginatedOrgUnitTypeListList,
    useApiV2OrgunittypesDestroy,
} from 'Iaso/api/orgUnitTypes';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { baseUrls } from '../../../../constants/urls';
import { OrgUnitsTypesDialog } from '../components/OrgUnitsTypesDialog';
import MESSAGES from '../messages';

export const baseUrl = baseUrls.orgUnitTypes;

type SubUnitType = NonNullable<
    PaginatedOrgUnitTypeListList['results']
>[number]['sub_unit_types'][number];
type ProjectType = NonNullable<
    PaginatedOrgUnitTypeListList['results']
>[number]['projects'];

export const useGetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteType } = useApiV2OrgunittypesDestroy();
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
            Cell: (settings: { value: ProjectType }) => (
                <ProjectChips projects={settings.value} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.subUnitTypes),
            accessor: 'sub_unit_types',
            Cell: settings =>
                settings.value?.length
                    ? settings.value
                          ?.map((subType: SubUnitType) => subType.name)
                          .join(',')
                    : textPlaceholder,
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
                        id={parseInt(settings.row.original.id)}
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
                            deleteType({ id: settings.row.original.id });
                        }}
                    />
                </section>
            ),
        },
    ];
};
