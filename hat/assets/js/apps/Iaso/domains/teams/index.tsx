import React, { FunctionComponent } from 'react';
import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, UrlParams, useSafeIntl } from 'bluesquare-components';
import { useApiTeamsList } from 'Iaso/api/teams';
import { ColumnsSelectDrawer } from 'Iaso/components/tables/ColumnSelectDrawer';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import TopBar from '../../components/nav/TopBarComponent';
import { AddTeamModal } from './components/CreateEditTeam';
import { TeamFilters } from './components/TeamFilters';
import {
    DEFAULT_TEAMS_COLUMNS,
    useTeamsColumnSelectDrawer,
} from './components/useTeamColumnSelectDrawer';
import { useTeamColumns } from './config';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

const baseUrl = baseUrls.teams;
export const Teams: FunctionComponent = () => {
    const params: ParamsWithAccountId & Partial<UrlParams> =
        useParamsObject(baseUrl);
    const urlParams = useUrlParams(params, defaults);
    const { limit, page, fields, types, ...apiParams } = urlParams;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useApiTeamsList({
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined,
        fields: fields ? fields.split(',') : DEFAULT_TEAMS_COLUMNS,
        types: types ? types.split(',') : [],
        ...apiParams,
    });
    const defaultSorted = [{ id: 'id', desc: true }];
    const rawColumns = useTeamColumns();

    const {
        options,
        setOptions,
        visibleColumns,
        handleApplyOptions,
        isDisabled,
    } = useTeamsColumnSelectDrawer(rawColumns, urlParams, baseUrl);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TeamFilters params={urlParams} />
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
