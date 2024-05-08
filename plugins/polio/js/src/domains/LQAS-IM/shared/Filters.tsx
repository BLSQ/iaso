import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Select, useSafeIntl, IconButton } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import MESSAGES from '../../../constants/messages';
import { makeCampaignsDropDown } from '../../../utils/index';
import { useRedirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useGetLqasImCountriesOptions } from './hooks/api/useGetLqasImCountriesOptions';
import { RefreshLqasData } from './RefreshLqasData';
import { baseUrls } from '../../../constants/urls';

export type Params = {
    campaign: string | undefined;
    country: string | undefined;
    rounds: string | undefined;
};

type FiltersState = {
    campaign: string | undefined;
    country: string | undefined;
};

type Props = {
    isFetching: boolean;
    campaigns: any[];
    campaignsFetching: boolean;
    category: 'lqas' | 'im';
    params: Params;
};

const lqasUrl = baseUrls.lqasCountry;
const imUrl = baseUrls.im;

export const Filters: FunctionComponent<Props> = ({
    isFetching,
    campaigns,
    campaignsFetching,
    category,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const currentUrl = category === 'lqas' ? lqasUrl : imUrl;

    const [filters, setFilters] = useState<FiltersState>({
        campaign: params?.campaign,
        country: params?.country,
    });
    const { campaign, country } = params;
    const currentUser = useCurrentUser();

    const { data: countriesOptions, isFetching: countriesLoading } =
        useGetLqasImCountriesOptions(category);

    const dropDownOptions = useMemo(() => {
        const displayedCampaigns = country
            ? campaigns.filter(c => `${c.top_level_org_unit_id}` === country)
            : campaigns;
        return makeCampaignsDropDown(displayedCampaigns);
    }, [country, campaigns]);

    const onChange = useCallback(
        (key, value) => {
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
            redirectToReplace(currentUrl, newFilters);
        },
        [currentUrl, filters, redirectToReplace],
    );
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
                            url={campaignLink}
                            color="primary"
                            overrideIcon={OpenInNewIcon}
                            tooltipMessage={MESSAGES.goToCampaign}
                            dataTestId="lqas-campaign-link"
                        />
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
