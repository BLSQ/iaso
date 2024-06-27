import React, { Component } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';

import {
    commonStyles,
    LoadingSpinner,
    Table,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import mappingsTableColumns from './config';
import CreateMappingVersionDialogComponent from './components/CreateMappingVersionDialogComponent';
import { baseUrls } from '../../constants/urls.ts';
import { useGetMappingVersions } from './hooks.js';
import MESSAGES from './messages';
import { useParamsObject } from '../../routing/hooks/useParamsObject';

const baseUrl = baseUrls.mappings;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Mappings = props => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrl);
    const mappingVersionsResults = useGetMappingVersions(params);
    const redirectToReplace = useRedirectToReplace();
    const count = mappingVersionsResults?.data?.count ?? 0;
    const pages = mappingVersionsResults?.data?.pages ?? 0;
    return (
        <>
            {mappingVersionsResults.isFetching && <LoadingSpinner />}
            <TopBar title={formatMessage(MESSAGES.dhis2Mappings)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Table
                    data={mappingVersionsResults?.data?.mapping_versions || []}
                    pages={pages}
                    defaultSorted={[
                        { id: 'form_version__form__name', desc: true },
                        { id: 'form_version__version_id', desc: true },
                        { id: 'mapping__mapping_type', desc: true },
                    ]}
                    columns={mappingsTableColumns(formatMessage)}
                    count={count}
                    baseUrl={baseUrl}
                    params={params}
                    redirectTo={(_key, newParams) => {
                        redirectToReplace(baseUrl, newParams);
                    }}
                />
                <Grid
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <CreateMappingVersionDialogComponent />
                </Grid>
            </Box>
        </>
    );
};

export default Mappings;
