import React, { useMemo } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { object } from 'prop-types';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink.tsx';
import { useRouter } from 'Iaso/routing/hooks/useRouter.tsx';
import { useGetCountryUsersGroup, useGetProfiles } from '../requests';
import MESSAGES from '../../../../constants/messages';
import { CountryNotificationsConfigModal } from '../CountryNotificationsConfigModal';
import { CONFIG_BASE_URL } from '../../../../constants/routes';

const makeUserNameToDisplay = user => {
    if (user.email) return ` ${user.email}`;
    if (user.first_name && user.last_name)
        return ` ${user.first_name} ${user.last_name}`;
    return ` ${user.username}`;
};

const allLanguages = [
    { value: 'EN', label: 'EN' },
    { value: 'FR', label: 'FR' },
    { value: 'PT', label: 'PT' },
];

export const CountryNotificationsConfigTable = () => {
    const { formatMessage } = useSafeIntl();
    const { params } = useRouter();
    const tableParams = useMemo(
        () => ({
            order: params.order ?? 'country__name', // Watch out, needs 2 underscores
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 50,
        }),
        [params.order, params.page, params.pageSize],
    );

    const { data: allUsers } = useGetProfiles();
    const { data: tableData, isLoading } = useGetCountryUsersGroup(tableParams);

    const columns = [
        {
            Header: formatMessage(MESSAGES.country),
            id: 'country__name',
            accessor: 'country_name', // Watch out, needs 2 underscores
            sortable: true,
            align: 'left',
        },
        {
            Header: formatMessage(MESSAGES.usersToNotify),
            accessor: 'read_only_users_field',
            width: 100,
            sortable: false,
            align: 'left',
            Cell: settings =>
                settings.value.map(makeUserNameToDisplay).toString().trim(),
        },
        {
            Header: formatMessage(MESSAGES.language),
            sortable: true,
            accessor: 'language',
        },
        {
            Header: formatMessage(MESSAGES.actions),
            sortable: false,
            accessor: 'actions',
            Cell: settings => {
                return (
                    <CountryNotificationsConfigModal
                        onConfirm={() => null}
                        countryId={settings.row.original.id}
                        countryName={settings.row.original.country_name}
                        language={settings.row.original.language}
                        users={settings.row.original.users}
                        teams={settings.row.original.teams}
                        allUsers={allUsers?.profiles}
                        allLanguages={allLanguages}
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={() => {
                                    openDialog();
                                }}
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                size="small"
                            />
                        )}
                    />
                );
            },
        },
    ];
    return (
        <TableWithDeepLink
            data={tableData?.country_users_group ?? []}
            params={tableParams}
            columns={columns}
            baseUrl={CONFIG_BASE_URL}
            pages={tableData?.pages ?? 1}
            count={tableData?.count ?? 1}
            multiselect={false}
            extraProps={{
                loading: isLoading,
            }}
        />
    );
};

CountryNotificationsConfigTable.propTypes = {
    params: object.isRequired,
};
