import React, { FunctionComponent, useMemo } from 'react';
import {
    useSafeIntl,
    // Table,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { PaginationParams } from '../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useParamsObject } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { GroupedCampaignsFilter } from './GroupedCampaignsFilter';
import { useStyles } from '../../styles/theme';
import { GroupedCampaignDialog } from './GroupedCampaignDialog';
import { TableWithDeepLink } from '../../../../../../hat/assets/js/apps/Iaso/components/tables/TableWithDeepLink';
import { useGroupedCampaignsColumns } from './config';
import { useDeleteGroupedCampaign } from './hooks/useDeleteGroupedCampaign';
import { useGetGroupedCampaigns } from './hooks/useGetGroupedCampaigns';
import { baseUrls } from '../../constants/urls';
import MESSAGES from '../../constants/messages';

type Params = PaginationParams & {
    search?: string;
};

const DEFAULT_PAGE_SIZE = '10';
const DEFAULT_PAGE = '1';
const DEFAULT_ORDER = '-updated_at';
const baseUrl = baseUrls.groupedCampaigns;

export const GroupedCampaigns: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as Params;
    const tableParams = useMemo(() => {
        return {
            order: params.order ?? DEFAULT_ORDER,
            pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
            page: params.page ?? DEFAULT_PAGE,
            search: params.search,
        };
    }, [params]);
    const { data: groupedCampaigns, isFetching } =
        useGetGroupedCampaigns(tableParams);
    const { mutateAsync: deleteGroupedCampaign } = useDeleteGroupedCampaign({params: tableParams, count: groupedCampaigns?.count ?? 0});
    const columns = useGroupedCampaignsColumns(deleteGroupedCampaign);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.groupedCampaigns)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <GroupedCampaignsFilter params={params} />
                <Grid
                    container
                    spacing={0}
                    justifyContent="flex-end"
                    alignItems="center"
                    className={classes.marginTop}
                >
                    <GroupedCampaignDialog
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent
                                dataTestId="add-grouped_campaign-button"
                                onClick={openDialog}
                            />
                        )}
                        type="create"
                    />
                </Grid>
                <TableWithDeepLink
                    data={groupedCampaigns?.results ?? []}
                    pages={groupedCampaigns?.pages ?? 1}
                    defaultSorted={[{ id: 'updated_at', desc: true }]}
                    columns={columns}
                    count={groupedCampaigns?.count ?? 0}
                    baseUrl={baseUrl}
                    params={tableParams}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
