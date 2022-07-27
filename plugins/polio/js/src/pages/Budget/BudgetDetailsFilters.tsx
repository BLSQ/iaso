/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@material-ui/core';
import { UrlParams } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../constants/routes';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { useGetTeamsDropDown } from '../../hooks/useGetTeams';
import { useAllEventsOption } from './CreateEditBudgetEvent/utils';

type Props = {
    params: UrlParams & {
        campaignId?: string;
        campaignName?: string;
        country?: string;
        show_deleted?: string;
        action?: string;
        senderTeam?: string;
        recipient?: string;
        type?: string;
    };
};

export const BudgetDetailsFilters: FunctionComponent<Props> = ({ params }) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(BUDGET_DETAILS, params);
    const { data: teams, isFetching } = useGetTeamsDropDown();
    const eventList = useAllEventsOption();
    return (
        <Box mb={4}>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="senderTeam"
                        onChange={handleChange}
                        type="select"
                        options={teams}
                        multi={false}
                        value={filters.senderTeam}
                        label={MESSAGES.sentByTeam}
                        loading={isFetching}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="recipient"
                        onChange={handleChange}
                        type="select"
                        options={teams}
                        multi={false}
                        value={filters.recipient}
                        label={MESSAGES.sentToTeam}
                        loading={isFetching}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="type"
                        onChange={handleChange}
                        type="select"
                        options={eventList}
                        multi={false}
                        value={filters.type}
                        label={MESSAGES.eventType}
                    />
                </Grid>
                <Grid container item xs={3} justifyContent="flex-end">
                    <Box mt={2} mr={-2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
