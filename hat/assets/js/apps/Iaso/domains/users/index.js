import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { fetchUsersProfiles, deleteUser } from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import UsersDialog from './components/UsersDialog';

import { baseUrls } from '../../constants/urls';

import usersTableColumns from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';

const baseUrl = baseUrls.users;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Users = ({ params }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const profiles = useSelector(state => state.users.list);
    const count = useSelector(state => state.users.count || 0);
    const pages = useSelector(state => state.users.pages);
    const fetching = useSelector(state => state.users.fetching);

    useEffect(() => {
        dispatch(fetchUsersProfiles(params));
    }, [
        params.pageSize,
        params.order,
        params.page,
        params.search,
        params,
        dispatch,
    ]);

    return (
        <>
            {fetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.users)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters baseUrl={baseUrl} params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <UsersDialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent onClick={openDialog} />
                        )}
                        params={params}
                    />
                </Grid>
                <Table
                    data={profiles}
                    pages={pages}
                    defaultSorted={[{ id: 'user__username', desc: false }]}
                    columns={usersTableColumns(
                        formatMessage,
                        user => dispatch(deleteUser(user, params)),
                        params,
                    )}
                    count={count}
                    baseUrl={baseUrl}
                    params={params}
                    redirectTo={(b, p) => dispatch(redirectTo(b, p))}
                />
            </Box>
        </>
    );
};

Users.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Users;
