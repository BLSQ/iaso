import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useActiveParams } from '../../routing/hooks/useActiveParams';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { MissionFilters } from './components/MissionFilters';
import { useMissionColumns } from './config';
import { useGetMissions } from './hooks/requests/useGetMissions';
import MESSAGES from './messages';
import { MissionParams } from './types';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.missions;
export const Missions: FunctionComponent = () => {
    const params = useParamsObject(baseUrl);
    const apiParams = useActiveParams(params) as MissionParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetMissions(apiParams);
    const columns = useMissionColumns(params, data?.count ?? 0);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <MissionFilters params={apiParams} />

                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={apiParams}
                    extraProps={{ loading: isFetching }}
                    columnSelectorEnabled
                    countOnTop={false}
                />
            </Box>
        </>
    );
};
