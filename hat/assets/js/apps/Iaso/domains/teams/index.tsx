import React, { FunctionComponent } from 'react';
import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { ColumnsSelectDrawer } from 'Iaso/components/tables/ColumnSelectDrawer';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useActiveParams } from 'Iaso/routing/hooks/useActiveParams';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import TopBar from '../../components/nav/TopBarComponent';
import { AddTeamModal } from './components/CreateEditTeam';
import { TeamFilters } from './components/TeamFilters';
import { useTeamsColumnSelectDrawer } from './components/useTeamColumnSelectDrawer';
import { useTeamColumns } from './config';
import { useGetTeams } from './hooks/requests/useGetTeams';
import MESSAGES from './messages';
import { TeamUrlParams } from './types/team';

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.teams;
export const Teams: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const apiParams = useActiveParams(params) as unknown as TeamUrlParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetTeams(apiParams);
    const defaultSorted = [{ id: 'id', desc: true }];
    const rawColumns = useTeamColumns({ params: apiParams, data });

    const {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    } = useTeamsColumnSelectDrawer(rawColumns, apiParams, baseUrl);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TeamFilters params={apiParams} />
                <Box display="flex" justifyContent="flex-end" mb={2}>
                    <ColumnsSelectDrawer
                        options={options}
                        setOptions={setOptions}
                        handleApplyOptions={handleApplyOptions}
                        isDisabled={isDisabled}
                        disabled={false}
                    />
                </Box>
                <Box display="flex" justifyContent="flex-end">
                    <AddTeamModal dialogType="create" iconProps={{}} />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={visibleColumns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
