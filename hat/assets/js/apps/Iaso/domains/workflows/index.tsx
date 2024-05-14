import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl, useGoBack } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { Filters } from './components/Filters';
import { AddVersionModal } from './components/versions/Modal';
import { useGetWorkflowVersions } from './hooks/requests/useGetWorkflowVersions';
import { useGetType } from '../entities/entityTypes/hooks/requests/entitiyTypes';
import { WorkflowsParams } from './types';
import { baseUrls } from '../../constants/urls';
import { useGetColumns, defaultSorted, baseUrl } from './config';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Workflows: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.workflows) as WorkflowsParams;
    const goBack = useGoBack(baseUrls.entityTypes);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetWorkflowVersions(params);
    const { entityTypeId } = params;
    const columns = useGetColumns(entityTypeId);

    const { data: entityType } = useGetType(entityTypeId);
    const title = entityType
        ? `${entityType.name} - ${formatMessage(MESSAGES.workflows)}`
        : '';
    return (
        <>
            <TopBar title={title} displayBackButton goBack={() => goBack()} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Box mt={2} display="flex" justifyContent="flex-end">
                    <AddVersionModal
                        entityTypeId={entityTypeId}
                        iconProps={{
                            dataTestId: 'add-workflow-version-button',
                        }}
                    />
                </Box>
                {/* @ts-ignore */}
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.workflow_versions ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={params}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
