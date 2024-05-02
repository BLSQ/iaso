import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { CreateEditTeam } from './components/CreateEditTeam';
import { TeamParams } from './types/team';
import { TeamFilters } from './components/TeamFilters';
import { useGetTeams } from './hooks/requests/useGetTeams';
import { useDeleteTeam } from './hooks/requests/useDeleteTeam';
import { baseUrls } from '../../constants/urls';
import { teamColumns } from './config';
import { useSingleTableParams } from '../../components/tables/SingleTable';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.teams;
export const Teams: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as TeamParams;
    const apiParams = useSingleTableParams(params);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetTeams(apiParams);
    const { mutate: deleteTeam } = useDeleteTeam();
    const defaultSorted = [{ id: 'id', desc: true }];

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TeamFilters params={apiParams} />
                <Box display="flex" justifyContent="flex-end">
                    <CreateEditTeam dialogType="create" />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={teamColumns(formatMessage, deleteTeam)}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
