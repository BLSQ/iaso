import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Box, Grid } from '@mui/material';

import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    Table,
    AddButton as AddButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import GroupsDialog from './components/GroupsDialog';

import tableColumns, { baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../../routing/actions';

import { useGetGroups, useSaveGroups, useDeleteGroups } from './hooks/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Groups = ({ params }) => {
    const dispatch = useDispatch();
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetGroups(params);
    const { mutate: deleteGroup, isLoading: deleting } = useDeleteGroups();
    const { mutateAsync: saveGroup, isLoading: saving } = useSaveGroups();

    const isLoading = isFetching || deleting || saving;
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.groups)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Table
                    data={data?.groups ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={tableColumns(
                        formatMessage,
                        params,
                        deleteGroup,
                        saveGroup,
                    )}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    redirectTo={(_, newParams) =>
                        dispatch(redirectTo(baseUrl, newParams))
                    }
                />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <GroupsDialog
                        saveGroup={saveGroup}
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent
                                dataTestId="add-group-button"
                                onClick={openDialog}
                            />
                        )}
                        params={params}
                    />
                </Grid>
            </Box>
        </>
    );
};

Groups.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Groups;
