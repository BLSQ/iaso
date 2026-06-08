import React, { FunctionComponent, useCallback } from 'react';
import { Box } from '@mui/material';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { LqasUrlParams } from '..';
import { NumberAsString, Side } from '../../../../constants/types';
import { baseUrls } from '../../../../constants/urls';
import { useGetCampaign } from '../../../Campaigns/hooks/api/useGetCampaign';
import { Filters } from '../../shared/Filters';
import { useLqasIm } from '../../shared/hooks/api/useLqasIm';
import { LqasImData } from '../../types';
import { useGetLqasRoundOptions } from '../hooks/useGetLqasCountriesOptions';
import {
    useLqasCountryData,
    UseLqasCountryDataResult,
} from '../hooks/useLqasCountryData';
import { LqasCountryViewFilters } from './Filters/LqasCountryViewFilters';
import { LqasFilterByDate } from './Filters/LqasFilterByDate';
import { LqasCountryCharts } from './LqasCountryCharts';
import { LqasCountryDataView } from './LqasCountryDataView';

type Props = {
    side: Side;
    params: LqasUrlParams;
    isEmbedded: boolean;
};

const baseUrl = baseUrls.lqasCountry;
const embeddedUrl = baseUrls.embeddedLqasCountry;

export const LqasCountryView: FunctionComponent<Props> = ({
    side,
    params,
    isEmbedded,
}) => {
    const countryId = params[`${side}Country`];
    const campaignId = params[`${side}Campaign`];
    const redirectToReplace = useRedirectToReplace();
    const currentUrl = isEmbedded ? embeddedUrl : baseUrl;
    const { data: lqasData, isFetching }: UseQueryResult<LqasImData> =
        useLqasIm('lqas', countryId, isEmbedded);
    const { data: campaign, isFetching: isFetchingCampaign } =
        useGetCampaign(campaignId);
    const campaignObrName = campaign?.obr_name;
    const roundNumber = params[`${side}Round`]
        ? parseInt(params[`${side}Round`] as string, 10)
        : undefined;
    const { data: roundOptions } = useGetLqasRoundOptions({ side, params });

    const {
        convertedData,
        debugData,
        hasScope,
        chartData,
    }: UseLqasCountryDataResult = useLqasCountryData({
        campaignObrName,
        side,
        roundNumber,
        lqasData,
    });

    const onRoundChange = useCallback(
        (value: number | NumberAsString) => {
            redirectToReplace(currentUrl, {
                ...params,
                [`${side}Round`]: value,
            });
        },
        [params, side, redirectToReplace, currentUrl],
    );
    const hasRoundNumber = Number.isSafeInteger(roundNumber);
    return (
        <>
            <Box>
                <LqasCountryViewFilters
                    side={side}
                    params={params}
                    currentUrl={currentUrl}
                    isEmbedded={isEmbedded}
                    isFetching={isFetching}
                />
                <LqasCountryDataView
                    params={params}
                    side={side}
                    countryId={countryId ? parseInt(countryId, 10) : undefined}
                    campaign={campaign}
                    data={convertedData}
                    roundNumber={roundNumber}
                    isFetching={isFetching}
                    debugData={debugData}
                    roundOptions={roundOptions}
                    onRoundChange={onRoundChange}
                    isEmbedded={isEmbedded}
                    currentUrl={currentUrl}
                />
                {!isFetchingCampaign && !isFetching && hasRoundNumber && (
                    <LqasCountryCharts
                        lqasData={lqasData}
                        hasScope={hasScope}
                        roundNumber={roundNumber}
                        chartData={chartData}
                        isFetching={isFetching}
                        isFetchingCampaign={isFetchingCampaign}
                        campaignObrName={campaignObrName}
                        convertedData={convertedData}
                        countryId={countryId}
                        isEmbedded={isEmbedded}
                    />
                )}
            </Box>
        </>
    );
};
