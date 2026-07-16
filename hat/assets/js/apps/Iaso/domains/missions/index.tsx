import React, { FunctionComponent } from 'react';
import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, UrlParams, useSafeIntl } from 'bluesquare-components';
import { useApiMicroplanningMissionsList } from 'Iaso/api/missions';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import TopBar from '../../components/nav/TopBarComponent';
import { MissionFilters } from './components/MissionFilters';
import { useMissionColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

const baseUrl = baseUrls.missions;
export const Missions: FunctionComponent = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> =
        useParamsObject(baseUrl);

    const safeParams = useUrlParams(params, defaults);
    const { limit, page, ...apiParams } = useApiParams(safeParams);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useApiMicroplanningMissionsList({
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined,
        ...apiParams,
    });

    const columns = useMissionColumns();

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
                    extraProps={{ loading: isLoading }}
                    columnSelectorEnabled
                    columnSelectorButtonType="button"
                />
            </Box>
        </>
    );
};
