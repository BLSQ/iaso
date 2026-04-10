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
import {
    ApiValidationWorkflowsListParams,
    PaginatedValidationWorkflowListList,
    useApiValidationWorkflowsList,
} from 'Iaso/api';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../messages';
import { useWorkflowsTableColumns } from './columns';
import { Filters } from './Filters';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

export const SubmissionValidation = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> = useParamsObject(
        baseUrls.instanceValidation,
    );
    if (params?.page) {
        params.page = parseInt(params?.page);
    }

    if (params?.pageSize) {
        params.pageSize = parseInt(params?.pageSize);
    }

    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    ApiValidationWorkflowsListParams.parse(params);
    const { data: workflows, isFetching: isLoadingWorkflows } =
        useApiValidationWorkflowsList(params, {
            query: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        });
    PaginatedValidationWorkflowListList.parse(workflows);

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
                            to={`/${baseUrls.instanceValidationDetail}/`}
                        >
                            <Add className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.create)}
                        </LinkButton>
                    </Box>
                </Grid>
                <SimpleTableWithDeepLink
                    params={params}
                    isFetching={isLoadingWorkflows}
                    baseUrl={baseUrls.instanceValidation}
                    data={workflows}
                    columns={columns}
                />
            </Box>
        </>
    );
};
