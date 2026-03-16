import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { SimpleTableWithDeepLink } from 'Iaso/components/tables/SimpleTableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../messages';
import { useGetSubmissionValidationWorkflows } from './api/useGetSubmissionValidationWorkflows';
import { useWorkflowsTableColumns } from './columns';
import { Filters } from './Filters';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});

export const SubmissionValidation: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.instanceValidation);
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
