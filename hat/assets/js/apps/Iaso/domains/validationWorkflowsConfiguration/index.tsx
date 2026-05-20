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
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import { useGetSubmissionValidationWorkflows } from './api/Get';
import { Filters } from './components/Filters';
import { useWorkflowsTableColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

export const ValidationWorkflowsConfiguration = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.validationWorkflowsConfiguration,
    );
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: workflows, isFetching: isLoadingWorkflows } =
        useGetSubmissionValidationWorkflows(params);
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
