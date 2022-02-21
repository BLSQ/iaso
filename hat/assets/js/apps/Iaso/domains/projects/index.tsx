import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Box, Grid } from '@material-ui/core';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import { ProjectsDialog } from './components/ProjectsDialog';
import {
    useGetProjectsPaginated,
    useSave,
    useGetFeatureFlags,
} from './hooks/requests';

import { columns, baseUrl } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};

type Props = {
    params: Params;
};

export const Projects: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching: fetchingProjects } =
        useGetProjectsPaginated(params);
    const { data: featureFlags = [] } = useGetFeatureFlags();
    const { mutateAsync: saveProject, isLoading: saving } = useSave();

    const isLoading = fetchingProjects || saving;

    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.projects)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <ProjectsDialog
                        titleMessage={MESSAGES.create}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent onClick={openDialog} />
                        )}
                        featureFlags={featureFlags}
                        saveProject={saveProject}
                    />
                </Grid>
                <Table
                    data={data?.projects ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns(
                        formatMessage,
                        params,
                        featureFlags,
                        saveProject,
                    )}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
