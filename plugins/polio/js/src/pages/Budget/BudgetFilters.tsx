import { Box, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { IntlFormatMessage } from '../../../../../../hat/assets/js/apps/Iaso/types/intl';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import DatesRange from '../../../../../../hat/assets/js/apps/Iaso/components/filters/DatesRange';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/domains/plannings/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { BUDGET } from '../../constants/routes';
import { UrlParams } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { CampaignStatus } from '../../constants/types';
import { campaignStatuses } from '../../constants/campaignStatuses';

type Props = {
    params: UrlParams & {
        campaignType: string;
        showOnlyDeleted: boolean;
        r1StartTo: string;
        r1StartFrom: string;
        country: any;
        campaign: string;
        status: CampaignStatus;
    };
};

const statusOptions = (formatMessage: IntlFormatMessage) => {
    return campaignStatuses.map(status => {
        return {
            value: status,
            label: formatMessage(MESSAGES[status]),
        };
    });
};
const baseUrl = BUDGET;
export const BudgetFilters: FunctionComponent<Props> = ({ params }) => {
    console.log('filterParams', params);
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState(baseUrl, params);
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={5}>
                    <DatesRange
                        onChangeDate={handleChange}
                        dateFrom={filters.startdateFrom}
                        dateTo={filters.endDateUntil}
                        labelFrom={MESSAGES.R1StartFrom}
                        labelTo={MESSAGES.R1StartTo}
                        keyDateFrom="r1StartFrom"
                        keyDateTo="r1StartTo"
                    />
                </Grid>
                <Grid item xs={2}>
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="general_status"
                        onChange={handleChange}
                        value={filters.general_status}
                        options={statusOptions(formatMessage)}
                        label={MESSAGES.status}
                    />
                </Grid>
                <Grid container item xs={2} justifyContent="flex-end">
                    <Box mt={2} mb={2} style={{ textAlign: 'end' }}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
