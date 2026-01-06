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
import { DisplayIfUserHasPerm } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import MESSAGES from '../../../../../constants/messages';
import { POLIO_ADMIN } from '../../../../../constants/permissions';
import { baseUrls } from '../../../../../constants/urls';
import { RefreshLqasIMData } from '../../../shared/RefreshLqasIMData';
import { Campaign, Side } from '../../../../../constants/types';
import { UseQueryResult } from 'react-query';
import { useGetCampaigns } from '../../../../Campaigns/hooks/api/useGetCampaigns';
import { LqasUrlParams } from '../..';
import { useGetLqasImCountriesOptions } from '../../../shared/hooks/api/useGetLqasImCountriesOptions';
import { sortCampaignNames } from '../../../../../utils';

const makeCampaignsDropDown = (
    campaigns: Campaign[] | undefined,
): { label: string; value: string }[] =>
    campaigns
        ?.map(campaign => ({
            label: campaign.obr_name,
            value: campaign.id,
        }))
        .sort(sortCampaignNames) ?? [];

type Props = {
    isFetching: boolean;
    params: LqasUrlParams;
    side: Side;
    isEmbedded: boolean;
};

export const LqasFilterByCountry: FunctionComponent<Props> = ({
    isFetching,
    params,
    side,
    isEmbedded,
}) => {
    const { formatMessage } = useSafeIntl();
    const country = side === 'left' ? params.leftCountry : params.rightCountry;
    const campaign =
        side === 'left' ? params.leftCampaign : params.rightCampaign;
    const redirectToReplace = useRedirectToReplace();
    const currentUrl = isEmbedded
        ? baseUrls.embeddedLqasCountry
        : baseUrls.lqasCountry;

    const { data: countriesOptions, isFetching: countriesLoading } =
        useGetLqasImCountriesOptions(isEmbedded);

    const { data: campaigns = [], isFetching: campaignsFetching } =
        useGetCampaigns({
            countries: country,
            enabled: Boolean(country),
            show_test: false,
            on_hold: true,
            is_embedded: isEmbedded,
        }) as UseQueryResult<Campaign[], Error>;

    // FIXME: use new params
    const [filters, setFilters] = useState<LqasUrlParams>({ ...params });

    const dropDownOptions = useMemo(() => {
        const displayedCampaigns = country
            ? campaigns.filter(c => `${c.top_level_org_unit_id}` === country)
            : campaigns;
        return makeCampaignsDropDown(displayedCampaigns);
    }, [country, campaigns]);

    //FIXME use new params
    const onChange = useCallback(
        (key, value) => {
            const newFilters = {
                ...filters,
                leftRound: side === 'left' ? undefined : filters.leftRound,
                rightRound: side === 'right' ? undefined : filters.rightRound, // This
                [key]: value,
            };
            if (key === 'leftCountry') {
                newFilters.leftCampaign = undefined;
            }
            if (key === 'rightCountry') {
                newFilters.rightCampaign = undefined;
            }

            setFilters(newFilters);
            redirectToReplace(currentUrl, newFilters);
        },
        [currentUrl, filters, redirectToReplace, side],
    );
    const campaignObj = campaigns.find(c => c.obr_name === campaign);
    const campaignLink = campaignObj
        ? `/${baseUrls.campaigns}/campaignId/${campaignObj.id}/search/${campaignObj.obr_name}`
        : null;
    return (
        <Box my={2} width="100%">
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
                        onChange={value => onChange(`${side}Country`, value)}
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
                        // Not showing campaigns before data has been fetched because selecting a campaign before the end of data fetching will cause bugs in the map
                        options={isFetching ? [] : dropDownOptions}
                        onChange={value => onChange(`${side}Campaign`, value)}
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
                        <RefreshLqasIMData countryId={country} />
                    </Grid>
                </DisplayIfUserHasPerm>
            </Grid>
        </Box>
    );
};
