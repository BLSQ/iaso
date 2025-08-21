import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
    useMemo,
} from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { ProjectChip } from 'Iaso/domains/projects/components/ProjectChip';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { ConfirmDeleteModal } from '../Dialog/ConfirmDeleteModal';
import { useCallbackOrgUnitConfigurationTypeDisplayName } from '../hooks/useCallbackOrgUnitConfigurationTypeDisplayName';
import MESSAGES from '../messages';
import {
    OrgUnitChangeRequestConfigsPaginated,
    OrgUnitChangeRequestConfigsParams,
    OrgUnitChangeRequestConfiguration,
} from '../types';
import { EditableFieldsCell } from './EditableFieldsCell';

const useColumns = (
    onEditClicked: Dispatch<SetStateAction<OrgUnitChangeRequestConfiguration>>,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const getTypeDisplayName = useCallbackOrgUnitConfigurationTypeDisplayName();
    // @ts-ignore
    return useMemo(
        () => [
            {
                Header: 'id',
                id: 'id',
                accessor: 'id',
                width: 30,
            },
            {
                Header: formatMessage(MESSAGES.project),
                id: 'project',
                accessor: row => <ProjectChip project={row.project} />,
            },
            {
                Header: formatMessage(MESSAGES.type),
                id: 'type',
                accessor: row => getTypeDisplayName(row.type),
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'org_unit_type__name',
                accessor: row => row.org_unit_type.name,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.editable_fields),
                id: 'editable_fields',
                sortable: false,
                Cell: EditableFieldsCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: settings => {
                    const handleEdit = useCallback(() => {
                        const configToUpdate = {
                            id: settings.row.original.id,
                            type: settings.row.original.type,
                            project: settings.row.original.project,
                            orgUnitType: settings.row.original.org_unit_type,
                        };
                        onEditClicked(configToUpdate);
                    }, [settings.row.original]);
                    return (
                        <>
                            <EditIconButton onClick={handleEdit} />
                            {/* @ts-ignore */}
                            <ConfirmDeleteModal
                                config={settings.row.original}
                            />
                        </>
                    );
                },
            },
        ],
        [formatMessage, onEditClicked, getTypeDisplayName],
    );
};

type Props = {
    data: OrgUnitChangeRequestConfigsPaginated | undefined;
    isFetching: boolean;
    onEditClicked: Dispatch<SetStateAction<OrgUnitChangeRequestConfiguration>>;
    params: OrgUnitChangeRequestConfigsParams;
};
export const baseUrl = baseUrls.orgUnitsChangeRequestConfiguration;
export const OrgUnitChangeRequestConfigsTable: FunctionComponent<Props> = ({
    data,
    isFetching,
    onEditClicked,
    params,
}) => {
    const columns = useColumns(onEditClicked);

    return (
        <TableWithDeepLink
            marginTop={false}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            defaultSorted={[{ id: 'updated_at', desc: true }]}
            columns={columns}
            count={data?.count ?? 0}
            baseUrl={baseUrl}
            countOnTop
            params={params}
            extraProps={{ loading: isFetching }}
        />
    );
};
