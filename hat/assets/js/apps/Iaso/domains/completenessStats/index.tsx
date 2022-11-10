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
import { UrlParams } from '../../types/table';

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

export const CompletessStats: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const { data: completenessStats, isFetching } =
        useGetCompletenessStats(params);
    const columns = useCompletenessStatsColumns();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.completeness)}
                displayBackButton={false}
            />
            <Box p={2} className={classes.container} pb={2}>
                <Box>
                    <CompletenessStatsFilters params={params} />
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
