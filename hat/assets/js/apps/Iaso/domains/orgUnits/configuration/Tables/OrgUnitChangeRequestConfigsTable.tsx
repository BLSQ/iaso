import React, {
    FunctionComponent,
    Dispatch,
    SetStateAction,
    useMemo,
    useCallback,
} from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import {
    OrgUnitChangeRequestConfigsPaginated,
    OrgUnitChangeRequestConfigsParams,
    OrgUnitChangeRequestConfiguration,
} from '../types';
import MESSAGES from '../messages';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { ConfirmDeleteModal } from '../Dialog/ConfirmDeleteModal';

const useColumns = (
    onEditClicked: Dispatch<SetStateAction<OrgUnitChangeRequestConfiguration>>,
): Column[] => {
    const { formatMessage } = useSafeIntl();
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
                accessor: row => row.project.name,
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
                accessor: row => row.editable_fields.join(', '),
                width: 600,
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
                            project: settings.row.original.project,
                            orgUnitType: settings.row.original.org_unit_type,
                        };
                        onEditClicked(configToUpdate);
                        // onEditClicked(settings.row.original);
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
        [formatMessage, onEditClicked],
    );
};

type Props = {
    data: OrgUnitChangeRequestConfigsPaginated | undefined;
    isFetching: boolean;
    onEditClicked: Dispatch<SetStateAction<OrgUnitChangeRequestConfig>>;
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
