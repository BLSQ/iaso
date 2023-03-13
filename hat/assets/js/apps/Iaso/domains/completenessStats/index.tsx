import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
// @ts-ignore
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, makeStyles } from '@material-ui/core';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { redirectTo } from '../../routing/actions';
import {
    CompletenessGETParams,
    useGetCompletenessStats,
} from './hooks/api/useGetCompletnessStats';
import { useCompletenessStatsColumns } from './hooks/useCompletenessStatsColumns';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { MENU_HEIGHT_WITHOUT_TABS } from '../../constants/uiConstants';
import { CompletenessStatsFilters } from './CompletenessStatsFilters';
import { Paginated, UrlParams } from '../../types/table';
import { CompletenessStats } from './types';

const baseUrl = baseUrls.completenessStats;
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    container: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        overflow: 'auto',
    },
}));

type Props = {
    params: UrlParams & CompletenessGETParams;
};

const RequestedOrgUnitStat = (props: {
    data: undefined | Paginated<CompletenessStats>;
}) => {
    const data = props.data;
    if (!data || !data.request_parent_forms_stats) {
        return null;
    }
    return (
        <div>
            {Object.values(data.request_parent_forms_stats).map(form_stats => (
                <li>
                    {form_stats.name}: {form_stats.itself_instances_count}
                </li>
            ))}
        </div>
    );
};

export const CompletessStats: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const { data: completenessStats, isFetching } =
        useGetCompletenessStats(params);
    const columns = useCompletenessStatsColumns(params, completenessStats);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.completenessStats)}
                displayBackButton={false}
            />
            <Box p={4} className={classes.container}>
                <Box>
                    <CompletenessStatsFilters params={params} />
                </Box>
                <Box>
                    <RequestedOrgUnitStat data={completenessStats} />
                </Box>
                <Box>
                    <TableWithDeepLink
                        marginTop={false}
                        data={completenessStats?.results ?? []}
                        pages={completenessStats?.pages ?? 1}
                        defaultSorted={['created_at']}
                        columns={columns}
                        // @ts-ignore
                        count={completenessStats?.count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        extraProps={{ loading: isFetching }}
                        onTableParamsChange={p => {
                            dispatch(redirectTo(baseUrl, p));
                        }}
                    />
                </Box>
            </Box>
        </>
    );
};
