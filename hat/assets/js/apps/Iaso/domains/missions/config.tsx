import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { MissionTypeValueEnum } from 'Iaso/api/missions';
import { DateTimeCellRfc } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { EntityAndFormChip } from './components/chips/EntityAndFormChip';
import { FormsChip } from './components/chips/FormsChip';
import { OrgUnitAndFormChip } from './components/chips/OrgUnitAndFormChip';
import { MissionActionsCell } from './components/MissionActionsCell';
import MESSAGES from './messages';

export const useMissionColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo<Column[]>(
        () => [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                id: 'name',
            },
            {
                Header: formatMessage(MESSAGES.missionType),
                accessor: 'mission_type',
                id: 'mission_type',
                Cell: ({ value }: any) => {
                    if (value === MissionTypeValueEnum.enum.FORM_FILLING) {
                        return <FormsChip />;
                    } else if (
                        value === MissionTypeValueEnum.enum.ENTITY_AND_FORM
                    ) {
                        return <EntityAndFormChip />;
                    } else if (
                        value === MissionTypeValueEnum.enum.ORG_UNIT_AND_FORM
                    ) {
                        return <OrgUnitAndFormChip />;
                    }
                    return value;
                },
            },
            {
                Header: formatMessage(MESSAGES.formsNumber),
                accessor: 'forms_count',
                sortable: false,
                Cell: ({ value, ...s }: any) => {
                    if (!value) {
                        return 0;
                    }
                    return <NumberCell value={value} {...s} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                accessor: 'org_unit_type',
                sortable: false,
                Cell: settings =>
                    settings.row.original.org_unit_type?.name ??
                    textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.entityType),
                accessor: 'entity_type',
                sortable: false,
                Cell: settings =>
                    settings.row.original.entity_type?.name ?? textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                id: 'created_at',
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => <MissionActionsCell {...settings} />,
            },
        ],
        [formatMessage],
    );
};
