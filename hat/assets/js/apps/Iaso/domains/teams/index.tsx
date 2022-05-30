import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { TeamParams } from './types';
import { TeamFilters } from './TeamFilters';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useGetTeams } from './hooks/requests/useGetTeams';
import { redirectTo } from '../../routing/actions';
import { teamColumns } from './config';
import { CreateEditTeam } from './CreateEditTeam';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: TeamParams;
};
const baseUrl = baseUrls.teams;
export const Teams: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetTeams(params);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <TeamFilters params={params} />

                <Box display="flex" justifyContent="flex-end">
                    <CreateEditTeam dialogType="create" />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={teamColumns(formatMessage)}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
