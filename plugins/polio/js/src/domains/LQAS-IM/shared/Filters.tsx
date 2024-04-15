import React, { FunctionComponent, useMemo, useState } from 'react';
// @ts-ignore
import { Select, useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';

import { Box, Grid, IconButton } from '@mui/material';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from '../../../../../../../hat/assets/js/apps/Iaso/routing/useRouter';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import MESSAGES from '../../../constants/messages';
import { makeCampaignsDropDown } from '../../../utils/index';
import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useGetLqasImCountriesOptions } from './hooks/api/useGetLqasImCountriesOptions';
import { RefreshLqasData } from './RefreshLqasData';

type Params = {
    campaign: string | undefined;
    country: string | undefined;
    rounds: string | undefined;
};
type FiltersState = {
    campaign: string | undefined;
    country: number | undefined;
};

type Props = {
    isFetching: boolean;
    campaigns: any[];
    campaignsFetching: boolean;
    category: 'lqas' | 'im';
};

export const Filters: FunctionComponent<Props> = ({
    isFetching,
    campaigns,
    campaignsFetching,
    category,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { params } = useRouter();

    const [filters, setFilters] = useState<FiltersState>({
        campaign: params.campaign,
        country: params.country ? parseInt(params.country, 10) : undefined,
    });
    const { campaign, country } = filters;
    const currentUser = useCurrentUser();

    const { data: countriesOptions, isFetching: countriesLoading } =
        useGetLqasImCountriesOptions(category);
    const dropDownOptions = useMemo(() => {
        const displayedCampaigns = country
            ? campaigns.filter(c => c.top_level_org_unit_id === country)
            : campaigns;
        return makeCampaignsDropDown(displayedCampaigns);
    }, [country, campaigns]);

    const onChange = (key, value) => {
        const newFilters = {
            ...filters,
            rounds: undefined, // This
            // rounds: '1,2', // This
            [key]: value,
        };
        if (key === 'country') {
            newFilters.campaign = undefined;
        }

        setFilters(newFilters);
        const url = genUrl(router, newFilters);
        dispatch(replace(url));
    };
    const campaignObj = campaigns.find(c => c.obr_name === campaign);
    const campaignLink = campaignObj
        ? `/dashboard/polio/list/campaignId/${campaignObj.id}/search/${campaignObj.obr_name}`
        : null;
    return (
        <Box mt={2} width="100%">
            <Grid container item spacing={2}>
                <Grid item xs={4}>
                    <Select
                        keyValue="countries"
                        label={formatMessage(MESSAGES.country)}
                        loading={countriesLoading}
                        clearable
                        multi={false}
                        value={country?.toString()}
                        options={countriesOptions}
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
                        // Not showing campaigns before Im data has been fetched because selecting a campaign before the end of data fetching will cause bugs in the map
                        options={isFetching ? [] : dropDownOptions}
                        onChange={value => onChange('campaign', value)}
                        disabled={Boolean(!country) && isFetching}
                    />
                </Grid>
                {campaignLink && (
                    <Grid item md={1}>
                        <IconButton
                            target="_blank"
                            href={campaignLink}
                            color="primary"
                        >
                            <OpenInNewIcon />
                        </IconButton>
                    </Grid>
                )}
                {/* remove condition when IM pipeline is ready */}
                {category === 'lqas' &&
                    userHasPermission('iaso_polio_config', currentUser) && (
                        <Grid item md={campaignLink ? 3 : 4}>
                            <RefreshLqasData
                                category={category}
                                countryId={country}
                            />
                        </Grid>
                    )}
            </Grid>
        </Box>
    );
};
