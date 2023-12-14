import React, { FunctionComponent, ReactElement } from 'react';
import { useDispatch } from 'react-redux';
import { Column, useSafeIntl } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import {
    ApproveChangesPaginated,
    ApproveOrgUnitParams,
    OrgUnitChangeRequest,
    OrgUnitValidationStatus,
} from '../types';
import { redirectTo } from '../../../../routing/actions';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from '../../components/LinkToOrgUnit';

type ColumnCell<T> = { row: { original: T } };

const useColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: 'id',
            id: 'id',
            accessor: 'id',
            width: 30,
        },
        {
            Header: formatMessage(MESSAGES.name),
            id: 'org_unit__name',
            accessor: 'org_unit_name',
            Cell: ({
                row: { original },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                return (
                    <LinkToOrgUnit
                        orgUnit={{
                            id: original.id,
                            name: original.org_unit_name,
                        }}
                    />
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.orgUnitsType),
            id: 'org_unit__org_unit_type__name',
            accessor: 'org_unit_type_name',
        },
        {
            Header: formatMessage(MESSAGES.groups),
            id: 'groups',
            accessor: 'groups',
            sortable: false,
            Cell: ({
                row: { original: changeRequest },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                const { groups } = changeRequest;
                return (
                    <>
                        {groups.length > 0
                            ? groups.map(group => group.name).join(', ')
                            : '--'}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.status),
            id: 'status',
            accessor: 'status',
            Cell: ({
                value: status,
            }: {
                value: OrgUnitValidationStatus;
            }): ReactElement => {
                return (
                    <>
                        {status && MESSAGES[status]
                            ? formatMessage(MESSAGES[status])
                            : '--'}
                    </>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            id: 'actions',
            accessor: 'actions',
            sortable: false,
            Cell: ({
                row: { original },
            }: ColumnCell<OrgUnitChangeRequest>): ReactElement => {
                return (
                    <>
                        ACTIONS
                        {/* {!settings.row.original.is_root &&
                            settings.row.original.has_children && (
                                <IconButtonComponent
                                    url={childrenPageUrl}
                                    tooltipMessage={MESSAGES.seeChildren}
                                    overrideIcon={AccountTree}
                                />
                            )}
                        {settings.row.original.is_root && (
                            <IconButtonComponent
                                url={parentPageUrl}
                                tooltipMessage={MESSAGES.seeParent}
                                overrideIcon={ArrowUpward}
                            />
                        )}
                        {hasSubmissionPermission && hasFormSubmissions && (
                            <IconButtonComponent
                                id={`form-link-${settings.row.original.id}`}
                                url={`/${baseUrls.instances}/accountId/${params.accountId}/page/1/levels/${orgunitId}`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewInstances}
                            />
                        )} */}
                    </>
                );
            },
        },
    ];
};

type Props = {
    data: ApproveChangesPaginated | undefined;
    isFetching: boolean;
    params: ApproveOrgUnitParams;
};
export const baseUrl = baseUrls.orgUnitsChangeRequest;
export const ApproveOrgUnitChangesTable: FunctionComponent<Props> = ({
    data,
    isFetching,
    params,
}) => {
    const dispatch = useDispatch();
    const columns = useColumns();
    return (
        // @ts-ignore
        <TableWithDeepLink
            marginTop={false}
            data={data?.results ?? []}
            pages={data?.pages ?? 1}
            defaultSorted={[{ id: 'org_unit__name', desc: false }]}
            columns={columns}
            count={data?.count ?? 0}
            baseUrl={baseUrl}
            countOnTop={false}
            params={params}
            extraProps={{ loading: isFetching }}
            onTableParamsChange={p => {
                dispatch(redirectTo(baseUrl, p));
            }}
        />
    );
};
