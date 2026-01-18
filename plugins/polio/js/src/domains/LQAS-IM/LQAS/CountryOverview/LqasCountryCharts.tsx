import { Box, Paper } from '@mui/material';
import { HorizontalDivider } from '../../../../components/HorizontalDivider';
import React, { FunctionComponent } from 'react';
import { GraphTitle } from '../../shared/charts/GraphTitle';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { LqasImHorizontalChart } from '../../shared/charts/LqasImHorizontalChart';
import { paperElevation } from '../../shared/constants';
import { LqasImVerticalChart } from '../../shared/charts/LqasImVerticalChart';
import { CaregiversTable } from '../Graphs/CaregiversTable';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { DistrictsNotFound } from '../../shared/DebugInfo/DistrictsNotFound';
import { DatesIgnored } from '../../shared/DebugInfo/DatesIgnored';
import { BadRoundNumbers } from '../../shared/DebugInfo/BadRoundNumber';
import { NumberAsString } from '../../../../constants/types';
import { ConvertedLqasImData, LqasChartData, LqasImData } from '../../types';

type Props = {
    lqasData?: LqasImData;
    hasScope: boolean;
    roundNumber?: number;
    chartData: LqasChartData;
    isFetching: boolean;
    isFetchingCampaign: boolean;
    campaignObrName?: string;
    convertedData: Record<string, ConvertedLqasImData>;
    countryId?: NumberAsString;
    isEmbedded?: boolean;
};

export const LqasCountryCharts: FunctionComponent<Props> = ({
    lqasData,
    hasScope,
    roundNumber,
    chartData,
    isFetching,
    campaignObrName,
    convertedData,
    countryId,
    isFetchingCampaign,
    isEmbedded = false,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
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
                    campaign={campaignObrName ?? ''}
                    countryId={countryId ? parseInt(countryId, 10) : undefined}
                    data={convertedData}
                    isLoading={isFetching}
                    isEmbedded={isEmbedded}
                />
            </Paper>

            <HorizontalDivider mt={6} mb={4} displayTrigger />
            <Box mb={2}>
                <GraphTitle
                    text={formatMessage(MESSAGES.reasonsNoFingerMarked)}
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
                        showChart={Boolean(campaignObrName)}
                    />
                </Box>
            </Paper>

            <HorizontalDivider mt={6} mb={4} ml={0} mr={0} displayTrigger />
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
                        showChart={Boolean(campaignObrName)}
                    />
                </Box>
            </Paper>

            <HorizontalDivider mt={6} mb={4} displayTrigger />
            <Box mb={2}>
                <GraphTitle
                    text={formatMessage(MESSAGES.caregivers_informed)}
                    displayTrigger
                />
            </Box>

            <CaregiversTable
                marginTop={false}
                campaign={campaignObrName}
                round={chartData.cg.round}
                data={convertedData}
                paperElevation={paperElevation}
                isLoading={isFetchingCampaign}
            />

            {Object.keys(convertedData).length > 0 && (
                <DisplayIfUserHasPerm permissions={['iaso_polio_config']}>
                    <HorizontalDivider mt={2} mb={4} displayTrigger />

                    <DistrictsNotFound
                        data={lqasData?.stats}
                        campaign={campaignObrName}
                    />

                    <DatesIgnored campaign={campaignObrName} data={lqasData} />

                    <BadRoundNumbers
                        formsWithBadRoundNumber={
                            campaignObrName
                                ? (lqasData?.stats[campaignObrName]
                                      ?.bad_round_number ?? 0)
                                : 0
                        }
                    />
                </DisplayIfUserHasPerm>
            )}
        </>
    );
};
