import React, { FunctionComponent } from 'react';
import { makeStyles, Box, Grid } from '@material-ui/core';
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

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: PlanningParams;
};
const baseUrl = baseUrls.planning;
export const Planning: FunctionComponent<Props> = ({ params }) => {
    // console.log('params', params);
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetPlannings(params);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                {/* // Your code here */}
                <PlanningFilters params={params} />
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <CreateEditPlanning type="create" />
                    </Grid>
                </Grid>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.plannings ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={planningColumns(formatMessage)}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
