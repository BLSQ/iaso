import React from 'react';
import Add from '@mui/icons-material/Add';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LinkButton,
    UrlParams,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiValidationWorkflowsList } from 'Iaso/api/validationWorkflows';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import { Filters } from './components/Filters';
import { useWorkflowsTableColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

export const ValidationWorkflowsConfiguration = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.validationWorkflowsConfiguration,
    );
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const safeParams = useUrlParams(params, defaults);
    const { limit, page, ...apiParams } = useApiParams(safeParams);

    const { data: workflows, isLoading: isLoadingWorkflows } =
        useApiValidationWorkflowsList({
            limit: limit ? parseInt(limit) : undefined,
            page: page ? parseInt(page) : undefined,
            ...apiParams,
        });

    const columns = useWorkflowsTableColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.configureInstancesValidation)}
            />

            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Filters params={params} />
                <Grid
                    container
                    spacing={2}
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Box mt={2}>
                        <LinkButton
                            buttonClassName={classes.marginLeft}
                            variant="contained"
                            color="primary"
                            size="medium"
                            target="_self"
                            to={`/${baseUrls.validationWorkflowsConfigurationDetail}/`}
                        >
                            <Add className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.create)}
                        </LinkButton>
                    </Box>
                </Grid>
                <SimpleTableWithDeepLink
                    params={params}
                    isFetching={isLoadingWorkflows}
                    baseUrl={baseUrls.validationWorkflowsConfiguration}
                    data={workflows}
                    columns={columns}
                />
            </Box>
        </>
    );
};
