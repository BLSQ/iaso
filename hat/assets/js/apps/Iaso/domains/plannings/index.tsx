import React, { FunctionComponent } from 'react';
import { makeStyles, Box, Grid } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { PlanningParams } from './types';
import { PlanningFilters } from './PlanningFilters';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useGetPlannings } from './hooks/requests/useGetPlannings';
import { redirectTo } from '../../routing/actions';
import { planningColumns } from './config';
import { CreateEditPlanning } from './CreateEditPlanning/CreateEditPlanning';
import { useDeletePlanning } from './hooks/requests/useDeletePlanning';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: PlanningParams;
};
const baseUrl = baseUrls.planning;
export const Planning: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetPlannings(params);
    const { mutateAsync: deletePlanning } = useDeletePlanning();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <PlanningFilters params={params} />
                <Grid container item justifyContent="flex-end">
                    <CreateEditPlanning type="create" />
                </Grid>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={planningColumns(formatMessage, deletePlanning)}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
