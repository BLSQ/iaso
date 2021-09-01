import React, { useEffect, useState } from 'react';
import {
    // LoadingSpinner,
    // Table,
    textPlaceholder,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
// import { useAPI } from '../../../../../../../hat/assets/js/apps/Iaso/utils/requests';
import { makeStyles } from '@material-ui/core';
import { withRouter } from 'react-router';
import moment from 'moment';
import { getCountryUsersGroup, getAllUsers } from '../requests';
import MESSAGES from '../../../constants/messages';
import { EmailNotificationsModal } from '../EmailNotificationsModal';
import SingleTable from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';
import { useAPI } from '../../../../../../../hat/assets/js/apps/Iaso/utils/requests';

const styles = {
    emailTable: {
        '& .rt-tbody': {
            maxHeight: '75vh',
        },
    },
};

const useStyles = makeStyles(styles);

const allLanguages = [
    { value: 'EN', label: 'EN' },
    { value: 'FR', label: 'FR' },
];

const EmailNotificationsTable = ({ params }) => {
    const classes = useStyles();
    const tableParams = {
        pageSize: params.pageSize ?? 0,
        page: params.page ?? 0,
        order: params.order ?? 'created_at',
    };
    const { data: allUsers } = useAPI(getAllUsers);
    const [forceRefresh, setForceRefresh] = useState(false);

    useEffect(() => {
        if (allUsers) setForceRefresh(true);
    }, [allUsers]);

    const columns = [
        {
            Header: 'Country',
            accessor: 'country_name',
            sortable: false,
            Cell: settings => {
                const text =
                    settings?.row?.original?.country_name ?? textPlaceholder;
                return text;
            },
        },
        {
            Header: 'Users',
            accessor: 'read_only_users_field',
            sortable: false,
            Cell: settings => {
                const userNames = settings.row.original.read_only_users_field
                    .map(user => user.username)
                    .toString();
                return userNames;
            },
        },
        {
            Header: 'Language',
            sortable: false,
            accessor: 'language',
            Cell: settings => {
                const text = settings.row.original.language ?? textPlaceholder;
                return text;
            },
        },
        {
            Header: 'Created',
            accessor: 'created_at',
            sortable: true,
            Cell: settings => {
                const createdAt = moment(
                    settings.row.original.created_at,
                ).format('LTS');
                return createdAt;
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
        <div className={classes.emailTable}>
            <SingleTable
                multiselect={false}
                fetchItems={getCountryUsersGroup}
                dataKey="country_users_group"
                columns={columns}
                baseUrl="/polio/config"
                params={tableParams}
                endPointPath="polio/countryusersgroup"
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
            />
        </div>
    );
};

const TableWithRouter = withRouter(EmailNotificationsTable);

export { TableWithRouter as EmailNotificationsTable };
