import React, { useEffect, useState } from 'react';
import {
    textPlaceholder,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { withRouter } from 'react-router';
import { object } from 'prop-types';
import { getCountryUsersGroup, getAllUsers } from '../requests';
import MESSAGES from '../../../constants/messages';
import { EmailNotificationsModal } from '../EmailNotificationsModal';
import SingleTable from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { useAPI } from '../../../../../../../hat/assets/js/apps/Iaso/utils/requests';

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

const EmailNotificationsTable = ({ params }) => {
    const tableParams = {
        pageSize: params.pageSize ?? 0,
        page: params.page ?? 0,
        order: 'country__name', // Watch out, needs 2 underscores
    };
    const { data: allUsers } = useAPI(getAllUsers);
    const [forceRefresh, setForceRefresh] = useState(false);

    useEffect(() => {
        if (allUsers) setForceRefresh(true);
    }, [allUsers]);

    const columns = [
        {
            Header: 'Country',
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
            Header: 'Users to notify',
            accessor: 'read_only_users_field',
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
            Header: 'Language',
            sortable: true,
            accessor: 'language',
            Cell: settings => {
                const text = settings.row.original.language ?? textPlaceholder;
                return text;
            },
        },
        {
            Header: 'Actions',
            sortable: false,
            accessor: 'actions',
            Cell: settings => {
                return (
                    <>
                        <EmailNotificationsModal
                            notifyParent={() => setForceRefresh(true)}
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
                    </>
                );
            },
        },
    ];
    return (
        <SingleTable
            multiselect={false}
            fetchItems={getCountryUsersGroup}
            dataKey="country_users_group"
            columns={columns}
            baseUrl="/polio/config"
            params={tableParams} // FIXME currently useless prop because of SingleTable bug
            endPointPath="polio/countryusersgroup"
            forceRefresh={forceRefresh}
            onForceRefreshDone={() => setForceRefresh(false)}
        />
    );
};

const TableWithRouter = withRouter(EmailNotificationsTable);

export { TableWithRouter as EmailNotificationsTable };

EmailNotificationsTable.propTypes = {
    params: object.isRequired,
};
