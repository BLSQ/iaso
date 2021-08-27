import React, { useState } from 'react';
import {
    // LoadingSpinner,
    // Table,
    ColumnText,
    textPlaceholder,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
// import { useAPI } from '../../../../../../../hat/assets/js/apps/Iaso/utils/requests';
import { makeStyles } from '@material-ui/core';
import { getCountryUsersGroup } from '../requests';
import MESSAGES from '../../../constants/messages';
import { EmailNotificationsModal } from '../EmailNotificationsModal';
import SingleTable from '../../../../../../../hat/assets/js/apps/Iaso/components/tables/SingleTable';

const styles = {
    emailTable: {
        '& .rt-tbody': {
            maxHeight: '75vh',
        },
    },
};

const useStyles = makeStyles(styles);

export const EmailNotificationsTable = () => {
    const classes = useStyles();
    const tableParams = {
        pageSize: 0,
        page: 0,
        order: 'country_name',
    };
    const [idToFetch, setIdToFetch] = useState(null);

    const columns = [
        {
            Header: 'Country',
            accessor: 'country_name',
            sortable: true,
            Cell: settings => {
                const text =
                    settings?.original?.country_name ?? textPlaceholder;
                return <ColumnText text={text} />;
            },
        },
        {
            Header: 'Users',
            accessor: 'read_only_users_field',
            sortable: true,
            Cell: settings => {
                const userNames = settings.original.read_only_users_field
                    .map(user => user.username)
                    .toString();
                return <ColumnText text={userNames} />;
            },
        },
        {
            Header: 'Language',
            sortable: true,
            accessor: 'language',
            Cell: settings => {
                const text = settings.original.language ?? textPlaceholder;
                return <ColumnText text={text} />;
            },
        },
        {
            Header: 'Actions',
            sortable: false,
            // eslint-disable-next-line no-unused-vars
            Cell: settings => {
                return (
                    <>
                        <EmailNotificationsModal
                            blockFetch={settings.original.id !== idToFetch}
                            onConfirm={() => null}
                            countryId={settings.original.id}
                            renderTrigger={({ openDialog }) => (
                                <IconButtonComponent
                                    onClick={() => {
                                        setIdToFetch(settings.original.id);
                                        openDialog();
                                    }}
                                    icon="edit"
                                    tooltipMessage={MESSAGES.edit}
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
                count={0}
                pages={0}
                baseUrl="/polio/config"
                params={tableParams}
                endPoinPath="/polio/config"
                // isFullheight={false}
            />
        </div>
    );
};
