import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    Table,
    UrlParams,
    commonStyles,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { CreateProjectDialog } from './components/CreateEditProjectDialog';
import { baseUrl, columns } from './config';
import { useGetProjectsPaginated, useSave } from './hooks/requests';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Projects: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.projects) as unknown as UrlParams;
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
                    <CreateProjectDialog
                        saveProject={saveProject}
                        dialogType="create"
                        iconProps={{
                            dataTestId: 'add-project-button',
                        }}
                    />
                </Grid>
                <Table
                    data={data?.projects ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns(formatMessage, saveProject)}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
