import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    AddButton as AddButtonComponent,
    useSafeIntl,
    LoadingSpinner,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import UsersDialog from './components/UsersDialog.tsx';

import { baseUrls } from '../../constants/urls';
import { useGetProfiles } from './hooks/useGetProfiles';
import { useDeleteProfile } from './hooks/useDeleteProfile';
import { useSaveProfile } from './hooks/useSaveProfile';

import usersTableColumns from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions.ts';
import { useCurrentUser } from '../../utils/usersUtils.ts';
import { BulkImportUsersDialog } from './components/BulkImportDialog/BulkImportDialog.tsx';

const baseUrl = baseUrls.users;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Users = ({ params }) => {
    const classes = useStyles();
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingProfiles } = useGetProfiles(params);

    const { mutate: deleteProfile, isLoading: deletingProfile } =
        useDeleteProfile();

    const { mutate: saveProfile, isLoading: savingProfile } = useSaveProfile();

    const isLoading = fetchingProfiles || deletingProfile || savingProfile;

    return (
        <>
            {isLoading && <LoadingSpinner />}
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
                            <AddButtonComponent
                                dataTestId="add-user-button"
                                onClick={openDialog}
                            />
                        )}
                        params={params}
                        saveProfile={saveProfile}
                        allowSendEmailInvitation
                        forceRefresh={isLoading}
                    />
                    <Box ml={2}>
                        <BulkImportUsersDialog />
                    </Box>
                </Grid>
                <Table
                    data={data?.profiles ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'user__username', desc: false }]}
                    columns={usersTableColumns({
                        formatMessage,
                        deleteProfile,
                        params,
                        currentUser,
                        saveProfile,
                    })}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{
                        pageSize: params.pageSize,
                        search: params.search,
                        refresh: isLoading,
                    }}
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
