import React, { FunctionComponent } from 'react';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl, Table } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { redirectTo } from 'Iaso/routing/actions';
import MESSAGES from '../../constants/messages';
import { GroupedCampaignsFilter } from './GroupedCampaignsFilter';
import { useStyles } from '../../styles/theme';
import { GROUPED_CAMPAIGNS } from '../../constants/routes';
import { useGetGroupedCampaigns } from '../../hooks/useGetGroupedCampaigns';
import { makeColumns } from './config';

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};
type Props = {
    params: Params;
};

export const GroupedCampaigns: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data: groupedCampaigns, isFetching } = useGetGroupedCampaigns();
    const dispatch = useDispatch();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.groupedCampaigns)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <GroupedCampaignsFilter />
                <Table
                    data={groupedCampaigns?.results ?? []}
                    pages={groupedCampaigns?.pages ?? 1}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    columns={makeColumns(formatMessage)}
                    count={groupedCampaigns?.count ?? 0}
                    baseUrl={GROUPED_CAMPAIGNS}
                    params={params}
                    onTableParamsChange={p =>
                        dispatch(redirectTo(GROUPED_CAMPAIGNS, p))
                    }
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
