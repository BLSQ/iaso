import React, { FunctionComponent, useCallback } from 'react';
import { NumberAsString, Side } from '../../../../constants/types';
import { LqasUrlParams } from '../lqas';
import { LqasCountryFilter } from './LqasCountryFilter';
import { Box, Grid, Paper } from '@mui/material';
import { UseQueryResult } from 'react-query';
import { LqasImData } from '../../types';
import { useLqasIm } from '../../shared/hooks/api/useLqasIm';
import { useGetCampaign } from '../../../Campaigns/hooks/api/useGetCampaign';
import {
    useLqasCountryData,
    UseLqasCountryDataResult,
} from './useLqasCountryData';
import { LqasCountryContainer } from './LqasCountryContainer';
import { useGetLqasRoundOptions } from './useGetLqasCountriesOptions';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { HorizontalDivider } from '../../../../components/HorizontalDivider';
import { GraphTitle } from '../../shared/charts/GraphTitle';
import { LqasImHorizontalChart } from '../../shared/charts/LqasImHorizontalChart';
import { paperElevation } from '../../shared/constants';
import { LqasImVerticalChart } from '../../shared/charts/LqasImVerticalChart';
import { CaregiversTable } from '../Graphs/CaregiversTable';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { DistrictsNotFound } from '../../shared/DebugInfo/DistrictsNotFound';
import { DatesIgnored } from '../../shared/DebugInfo/DatesIgnored';
import { BadRoundNumbers } from '../../shared/DebugInfo/BadRoundNumber';
import MESSAGES from '../../../../constants/messages';

type Props = {
    side: Side;
    params: LqasUrlParams;
};

const baseUrl = baseUrls.lqasCountry;

export const LqasCountryView: FunctionComponent<Props> = ({ side, params }) => {
    const { formatMessage } = useSafeIntl();
    const countryId = params[`${side}Country`];
    const campaignId = params[`${side}Campaign`];
    const redirectToReplace = useRedirectToReplace();
    const { data: lqasData, isFetching }: UseQueryResult<LqasImData> =
        useLqasIm('lqas', countryId);
    const { data: campaign, isFetching: isFetchingCampaign } =
        useGetCampaign(campaignId);
    const campaignObrName = campaign?.obr_name;
    const roundNumber = params[`${side}Round`]
        ? parseInt(params[`${side}Round`] as string, 10)
        : undefined;
    const { data: roundOptions, isFetching: isFetchingRoundOptions } =
        useGetLqasRoundOptions({ side, params });

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
            redirectToReplace(baseUrl, {
                ...params,
                [`${side}Round`]: value,
            });
        },
        [params, side, redirectToReplace],
    );
    const hasRoundNumber = Number.isSafeInteger(roundNumber);
    return (
        <>
            <Box>
                <LqasCountryFilter side={side} params={params} />
                <LqasCountryContainer
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
                />
                {!isFetchingCampaign && !isFetching && hasRoundNumber && (
                    <>
                        <HorizontalDivider mt={6} mb={4} displayTrigger />
                        <Box mb={2}>
                            <GraphTitle
                                text={formatMessage(MESSAGES.lqasPerRegion)}
                                displayTrigger
                            />
                        </Box>

                        <Paper elevation={paperElevation}>
                            <LqasImHorizontalChart
                                type="lqas"
                                round={roundNumber}
                                campaign={campaign?.obr_name}
                                countryId={
                                    countryId
                                        ? parseInt(countryId, 10)
                                        : undefined
                                }
                                data={convertedData}
                                isLoading={isFetching}
                            />
                        </Paper>

                        <HorizontalDivider mt={6} mb={4} displayTrigger />
                        <Box mb={2}>
                            <GraphTitle
                                text={formatMessage(
                                    MESSAGES.reasonsNoFingerMarked,
                                )}
                                displayTrigger={hasScope}
                            />
                        </Box>

                        <Paper elevation={paperElevation}>
                            <Box p={2}>
                                <LqasImVerticalChart
                                    data={chartData.nfm.data}
                                    chartKey={chartData.nfm.chartKey}
                                    title={chartData.nfm.title}
                                    isLoading={isFetching}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Paper>

                        <HorizontalDivider
                            mt={6}
                            mb={4}
                            ml={0}
                            mr={0}
                            displayTrigger
                        />
                        <Box mb={2}>
                            <GraphTitle
                                text={formatMessage(MESSAGES.reasonsForAbsence)}
                                displayTrigger={hasScope}
                            />
                        </Box>

                        <Paper elevation={paperElevation}>
                            <Box p={2}>
                                <LqasImVerticalChart
                                    data={chartData.rfa.data}
                                    chartKey={chartData.rfa.chartKey}
                                    title={chartData.rfa.title}
                                    isLoading={isFetching}
                                    showChart={Boolean(campaign)}
                                />
                            </Box>
                        </Paper>

                        <HorizontalDivider mt={6} mb={4} displayTrigger />
                        <Box mb={2}>
                            <GraphTitle
                                text={formatMessage(
                                    MESSAGES.caregivers_informed,
                                )}
                                displayTrigger
                            />
                        </Box>

                        <CaregiversTable
                            marginTop={false}
                            campaign={campaign?.obr_name}
                            round={chartData.cg.round}
                            data={convertedData}
                            paperElevation={paperElevation}
                            isLoading={isFetchingCampaign}
                        />

                        {Object.keys(convertedData).length > 0 && (
                            <DisplayIfUserHasPerm
                                permissions={['iaso_polio_config']}
                            >
                                <HorizontalDivider
                                    mt={2}
                                    mb={4}
                                    displayTrigger
                                />

                                <DistrictsNotFound
                                    data={lqasData?.stats}
                                    campaign={campaign}
                                />

                                <DatesIgnored
                                    campaign={campaign}
                                    data={lqasData}
                                />

                                <BadRoundNumbers
                                    formsWithBadRoundNumber={
                                        lqasData?.stats[campaign]
                                            ?.bad_round_number ?? 0
                                    }
                                />
                            </DisplayIfUserHasPerm>
                        )}
                    </>
                )}
            </Box>
        </>
    );
};
