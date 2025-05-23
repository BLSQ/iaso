import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    UrlParams,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { CreateProjectDialog } from './components/CreateEditProjectDialog';
import { baseUrl, useColumns } from './config';
import { useGetProjectsPaginated, useSave } from './hooks/requests';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Projects: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.projects) as unknown as UrlParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data, isFetching: fetchingProjects } =
        useGetProjectsPaginated(params);

    const { mutateAsync: saveProject, isLoading: saving } = useSave();

    const isLoading = fetchingProjects || saving;
    const columns = useColumns(saveProject);

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
                <TableWithDeepLink
                    data={data?.projects ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                />
            </Box>
        </>
    );
};
