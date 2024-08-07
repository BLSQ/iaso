import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { PlanningParams } from './types';
import { PlanningFilters } from './PlanningFilters';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useGetPlannings } from './hooks/requests/useGetPlannings';
import { usePlanningColumns } from './config';
import { CreateEditPlanning } from './CreateEditPlanning/CreateEditPlanning';
import { useDeletePlanning } from './hooks/requests/useDeletePlanning';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm';
import { PLANNING_WRITE } from '../../utils/permissions';
import { useActiveParams } from '../../routing/hooks/useActiveParams';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.planning;
export const Planning: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const apiParams = useActiveParams(params) as PlanningParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetPlannings(apiParams);
    const { mutateAsync: deletePlanning } = useDeletePlanning();
    const columns = usePlanningColumns(deletePlanning);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <PlanningFilters params={apiParams} />
                <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                    <Grid container item justifyContent="flex-end">
                        <CreateEditPlanning type="create" />
                    </Grid>
                </DisplayIfUserHasPerm>

                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
