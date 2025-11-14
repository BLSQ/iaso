import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useActiveParams } from '../../routing/hooks/useActiveParams';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { AddTeamModal } from './components/CreateEditTeam';
import { TeamFilters } from './components/TeamFilters';
import { useTeamColumns } from './config';
import { useGetTeams } from './hooks/requests/useGetTeams';
import MESSAGES from './messages';
import { TeamParams } from './types/team';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.teams;
export const Teams: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const apiParams = useActiveParams(params) as unknown as TeamParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetTeams(apiParams);
    const defaultSorted = [{ id: 'id', desc: true }];
    const columns = useTeamColumns();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TeamFilters params={apiParams} />
                <Box display="flex" justifyContent="flex-end">
                    <AddTeamModal dialogType="create" iconProps={{}} />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                    expanded={{}}
                    getObjectId={() => ''}
                />
            </Box>
        </>
    );
};
