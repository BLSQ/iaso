import React, { FunctionComponent, useCallback } from 'react';
import { NumberAsString, Side } from '../../../../constants/types';
import { LqasUrlParams } from '..';
import { LqasCountryFilter } from './LqasCountryFilter';
import { Box } from '@mui/material';
import { UseQueryResult } from 'react-query';
import { LqasImData } from '../../types';
import { useLqasIm } from '../../shared/hooks/api/useLqasIm';
import { useGetCampaign } from '../../../Campaigns/hooks/api/useGetCampaign';
import {
    useLqasCountryData,
    UseLqasCountryDataResult,
} from '../hooks/useLqasCountryData';
import { LqasCountryDataView } from './LqasCountryDataView';
import { useGetLqasRoundOptions } from '../hooks/useGetLqasCountriesOptions';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { LqasCountryCharts } from './LqasCountryCharts';

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
                <LqasCountryFilter
                    side={side}
                    params={params}
                    currentUrl={currentUrl}
                    isEmbedded={isEmbedded}
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
