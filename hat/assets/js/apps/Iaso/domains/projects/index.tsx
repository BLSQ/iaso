import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    commonStyles,
    Table,
    LoadingSpinner,
    useSafeIntl,
    AddButton as AddButtonComponent,
    UrlParams,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import { ProjectsDialog } from './components/ProjectsDialog';
import { useGetProjectsPaginated, useSave } from './hooks/requests';
import { columns, baseUrl } from './config';
import MESSAGES from './messages';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { baseUrls } from '../../constants/urls';
import { useRedirectTo } from '../../routing/routing';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Projects: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.projects) as UrlParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const { data, isFetching: fetchingProjects } =
        useGetProjectsPaginated(params);

    const { mutateAsync: saveProject, isLoading: saving } = useSave();

    const isLoading = fetchingProjects || saving;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.projects)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isLoading && <LoadingSpinner absolute />}
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
                            <AddButtonComponent
                                dataTestId="add-project-button"
                                onClick={openDialog}
                            />
                        )}
                        saveProject={saveProject}
                    />
                </Grid>
                {/* @ts-ignore */}
                <Table
                    data={data?.projects ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns(formatMessage, params, saveProject)}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
