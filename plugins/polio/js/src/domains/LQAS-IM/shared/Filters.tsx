import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Grid } from '@mui/material';
import {
    Select,
    useSafeIntl,
    IconButton,
    useRedirectToReplace,
} from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../../constants/messages';
import { POLIO_ADMIN } from '../../../constants/permissions';
import { IMType } from '../../../constants/types';
import { baseUrls } from '../../../constants/urls';
import { makeCampaignsDropDown } from '../../../utils/index';
import { LqasImFilterParams } from '../types';
import { useGetLqasImCountriesOptions } from './hooks/api/useGetLqasImCountriesOptions';
import { RefreshLqasIMData } from './RefreshLqasIMData';

type FiltersState = {
    campaign: string | undefined;
    country: string | undefined;
};

type Props = {
    isFetching: boolean;
    campaigns: any[];
    campaignsFetching: boolean;
    params: LqasImFilterParams;
    imType?: IMType;
};

const getCurrentUrl = (imType?: IMType | 'imHH'): string => {
    if (imType === 'imGlobal') {
        return baseUrls.imGlobal;
    }
    if (imType === 'imHH' || imType === 'imIHH') {
        return baseUrls.imHH;
    }
    if (imType === 'imOHH') {
        return baseUrls.imOHH;
    }
    return baseUrls.lqasCountry;
};

export const Filters: FunctionComponent<Props> = ({
    isFetching,
    campaigns,
    campaignsFetching,
    params,
    imType,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const currentUrl = getCurrentUrl(imType);
    const [filters, setFilters] = useState<FiltersState>({
        campaign: params?.campaign,
        country: params?.country,
    });
    const { campaign, country } = params;

    const { data: countriesOptions, isFetching: countriesLoading } =
        useGetLqasImCountriesOptions();

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
        ? `/${baseUrls.campaigns}/campaignId/${campaignObj.id}/search/${campaignObj.obr_name}`
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

                <DisplayIfUserHasPerm permissions={[POLIO_ADMIN]}>
                    <Grid item md={campaignLink ? 3 : 4}>
                        <RefreshLqasIMData
                            imType={imType}
                            countryId={country}
                        />
                    </Grid>
                </DisplayIfUserHasPerm>
            </Grid>
        </Box>
    );
};
