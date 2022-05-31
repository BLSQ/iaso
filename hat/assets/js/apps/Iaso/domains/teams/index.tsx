import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { CreateEditTeam } from './components/CreateEditTeam';

import { TeamParams } from './types/team';
import { TeamFilters } from './components/TeamFilters';
import { useGetTeams } from './hooks/requests/useGetTeams';
import { useDeleteTeam } from './hooks/requests/useDeleteTeam';
import { redirectTo } from '../../routing/actions';

import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { teamColumns } from './config';

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
    const { mutate: deleteTeam } = useDeleteTeam();
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
                    columns={teamColumns(formatMessage, deleteTeam)}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
