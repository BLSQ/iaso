import React, { useMemo, useState, FunctionComponent } from 'react';
import { Select, useSafeIntl } from 'bluesquare-components';
import { withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';

import { Grid, Box } from '@material-ui/core';

import MESSAGES from '../../constants/messages';

import { useGetCountries } from '../../hooks/useGetCountries';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';

import { makeCampaignsDropDown } from '../../utils/index';
import { genUrl } from '../../utils/routing';

type FiltersState = {
    campaign: string | undefined;
    country: string | undefined;
};
type Router = {
    params: FiltersState;
};
type Props = {
    isFetching: boolean;
    router: Router;
};

const Filters: FunctionComponent<Props> = ({ isFetching, router }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { params } = router;

    const [filters, setFilters] = useState<FiltersState>({
        campaign: params.campaign,
        country: params.country,
    });
    const { campaign, country } = filters;

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: [country],
            enabled: Boolean(country),
        }).query;

    const { data: countriesData, isFetching: countriesLoading } =
        useGetCountries();
    const countriesList = (countriesData && countriesData.orgUnits) || [];
    const dropDownOptions = useMemo(() => {
        const displayedCampaigns = country
            ? campaigns.filter(c => c.org_unit.id === country)
            : campaigns;
        return makeCampaignsDropDown(displayedCampaigns);
    }, [country, campaigns]);

    const onChange = (key, value) => {
        const newFilters = {
            ...filters,
            [key]: value,
        };
        if (key === 'country') {
            newFilters.campaign = undefined;
        }

        setFilters(newFilters);
        const url = genUrl(router, newFilters);
        dispatch(replace(url));
    };
    return (
        <Box px={2} mt={2} width="100%">
            <Grid container item spacing={4}>
                <Grid item xs={4}>
                    <Select
                        keyValue="countries"
                        label={formatMessage(MESSAGES.country)}
                        loading={countriesLoading}
                        clearable
                        multi={false}
                        value={country}
                        options={countriesList.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        onChange={value => onChange('country', value)}
                    />
                </Grid>
                <Grid item xs={4}>
                    <Select
                        keyValue="campaigns"
                        label={formatMessage(MESSAGES.campaign)}
                        loading={campaignsFetching || isFetching}
                        clearable
                        multi={false}
                        value={campaign}
                        // Not showing camapigns before Im data has been fetched because selecting a campaign before the end of data fetching will cause bugs in the map
                        options={isFetching ? [] : dropDownOptions}
                        onChange={value => onChange('campaign', value)}
                        disabled={Boolean(!country) && isFetching}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

const wrappedFilters = withRouter(Filters);
export { wrappedFilters as Filters };
