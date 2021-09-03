import React, { useMemo, useState } from 'react';
import {
    textPlaceholder,
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { object } from 'prop-types';
import { withRouter } from 'react-router';
import { getCountryUsersGroup, getAllUsers } from '../requests';
import MESSAGES from '../../../constants/messages';
import { CountryNotificationsConfigModal } from '../CountryNotificationsConfigModal';
import { useAPI } from '../../../../../../../hat/assets/js/apps/Iaso/utils/requests';
import { TableWithDeepLink } from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';

const makeUserNameToDisplay = user => {
    if (user.email) return ` ${user.email}`;
    if (user.first_name && user.last_name)
        return ` ${user.first_name} ${user.last_name}`;
    return ` ${user.username}`;
};

const allLanguages = [
    { value: 'EN', label: 'EN' },
    { value: 'FR', label: 'FR' },
];

const CountryNotificationsConfigTable = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const [refresh, setRefresh] = useState(false);
    const tableParams = useMemo(
        () => ({
            order: params.order ?? 'country__name', // Watch out, needs 2 underscores
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 10,
        }),
        [params.order, params.page, params.pageSize],
    );
    const { data: allUsers } = useAPI(getAllUsers);
    const { data: tableData, isLoading } = useAPI(
        getCountryUsersGroup,
        tableParams,
        {
            preventTrigger: false,
            additionalDependencies: [refresh],
        },
    );

    const columns = [
        {
            Header: formatMessage(MESSAGES.country),
            id: 'country__name',
            accessor: 'country_name', // Watch out, needs 2 underscores
            sortable: true,
            align: 'left',
            Cell: settings => {
                const text =
                    settings?.row?.original?.country_name ?? textPlaceholder;
                return text;
            },
        },
        {
            Header: formatMessage(MESSAGES.usersToNotify),
            accessor: 'read_only_users_field',
            width: 100,
            sortable: false,
            align: 'left',
            Cell: settings => {
                const userNames = settings.row.original.read_only_users_field
                    .map(makeUserNameToDisplay)
                    .toString()
                    .trim();
                return userNames;
            },
        },
        {
            Header: formatMessage(MESSAGES.language),
            sortable: true,
            accessor: 'language',
            Cell: settings => {
                const text = settings.row.original.language ?? textPlaceholder;
                return text;
            },
        },
        {
            Header: formatMessage(MESSAGES.actions),
            sortable: false,
            accessor: 'actions',
            Cell: settings => {
                return (
                    <CountryNotificationsConfigModal
                        notifyParent={() => setRefresh(!refresh)}
                        onConfirm={() => null}
                        countryId={settings.row.original.id}
                        language={settings.row.original.language}
                        users={settings.row.original.users}
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
            baseUrl="polio/config"
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

const tableWithRouter = withRouter(CountryNotificationsConfigTable);
export { tableWithRouter as CountryNotificationsConfigTable };
