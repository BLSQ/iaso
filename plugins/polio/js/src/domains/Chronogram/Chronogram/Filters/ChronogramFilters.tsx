import React, { FunctionComponent } from 'react';
import { Box, Button, Grid } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import * as Permission from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

import { baseUrls } from '../../../../constants/urls';
import { useGetCountries } from '../../../../hooks/useGetCountries';
import { useOptionChronogram } from '../../api/useOptionChronogram';
import MESSAGES from '../messages';
import { CreateChronogramModal } from '../Modals/CreateChronogramModal';
import { ChronogramParams } from '../types';

type Props = {
    params: ChronogramParams;
};

const baseUrl = baseUrls.chronogram;

export const ChronogramFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const { data: chronogramMetaData, isFetching: isFetchingMetaData } =
        useOptionChronogram();

    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const countriesOptions = (data && data.orgUnits) || [];

    const onTimeOptions = [
        {
            label: formatMessage(MESSAGES.yes),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.no),
            value: 'false',
        },
    ];

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3} lg={3}>
                    <InputComponent
                        type="search"
                        keyValue="search"
                        value={filters.search}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.filterLabelSearch}
                    />
                </Grid>
                <Grid item xs={12} md={3} lg={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="country"
                        multi
                        clearable
                        onChange={handleChange}
                        value={filters.country}
                        type="select"
                        options={countriesOptions.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        label={MESSAGES.filterLabelCountry}
                    />
                </Grid>
                <Grid item xs={12} md={3} lg={3}>
                    <InputComponent
                        loading={isFetchingMetaData}
                        keyValue="campaign"
                        multi
                        clearable
                        onChange={handleChange}
                        value={filters.campaign}
                        options={chronogramMetaData?.campaigns}
                        type="select"
                        label={MESSAGES.filterLabelCampaign}
                    />
                </Grid>
                <Grid item xs={12} md={3} lg={3}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="on_time"
                        value={filters.on_time}
                        onChange={handleChange}
                        options={onTimeOptions}
                        label={MESSAGES.filterLabelOnTime}
                    />
                </Grid>
            </Grid>
            <Grid container item justifyContent="flex-end">
                <Box mt={2}>
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
            <DisplayIfUserHasPerm permissions={[Permission.POLIO_CHRONOGRAM]}>
                <Grid container item justifyContent="flex-end" mt={4}>
                    <Box mr={2}>
                        <Button
                            variant="contained"
                            href={`/dashboard/${baseUrls.chronogramTemplateTask}`}
                        >
                            {formatMessage(
                                MESSAGES.linkToChronogramTemplateTask,
                            )}
                        </Button>
                    </Box>
                    <CreateChronogramModal
                        iconProps={{
                            message: MESSAGES.createChronogramTitle,
                        }}
                    />
                </Grid>
            </DisplayIfUserHasPerm>
        </>
    );
};
