import React, { FunctionComponent, useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@material-ui/core';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { blue } from '@material-ui/core/colors';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import {
    BarChartData,
    LqasImCampaign,
    RoundString,
} from '../../constants/types';
import { BAR_HEIGHT } from '../PercentageBarChart/constants';
import {
    convertStatToPercent,
    formatLqasDataForNFMChart,
    lqasNfmTooltipFormatter,
    sumChildrenChecked,
    sumChildrenCheckedLqas,
} from '../../pages/LQAS/utils';
import { formatImDataForNFMChart } from '../../pages/IM/utils';
import MESSAGES from '../../constants/messages';
import { NfmCustomTick } from './NfmCustomTick';

type Props = {
    // eslint-disable-next-line react/require-default-props
    data?: Record<string, LqasImCampaign>;
    // eslint-disable-next-line react/require-default-props
    campaign?: string;
    round: RoundString;
    chartKey: string;
    isLoading: boolean;
    showChart: boolean;
    type: 'LQAS' | 'IM';
};

export const NoFingerMark: FunctionComponent<Props> = ({
    data,
    chartKey,
    isLoading,
    showChart,
    campaign,
    round,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);

    const formattedData: BarChartData[] = useMemo(() => {
        if (type === 'IM') {
            return formatImDataForNFMChart({
                data,
                campaign,
                round,
                formatMessage,
            });
        }
        if (type === 'LQAS') {
            return formatLqasDataForNFMChart({
                data,
                campaign,
                round,
                formatMessage,
            });
        }
        return [];
    }, [data, campaign, round, formatMessage, type]);

    const childrenNotMarked = formattedData
        .map(nfmData => nfmData.absValue)
        .reduce((total, current) => total + current, 0);

    const childrenChecked: number =
        type === 'LQAS'
            ? sumChildrenCheckedLqas(round, data, campaign)
            : sumChildrenChecked(round, data, campaign);

    const ratioUnmarked = convertStatToPercent(
        childrenNotMarked,
        childrenChecked,
    );

    const roundText = round === 'round_1' ? 'round 1' : 'round 2';

    // Force render to avoid visual bug when data has length of 0
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [data]);
    return (
        <>
            {isLoading && <LoadingSpinner />}
            {!isLoading && showChart && (
                <>
                    <Box>
                        <Typography variant="h6">
                            {`${formatMessage(
                                MESSAGES.childrenNoMark,
                            )}, ${roundText}: ${ratioUnmarked}`}
                        </Typography>
                    </Box>
                    <Box key={`${chartKey}${renderCount}`}>
                        <ResponsiveContainer height={450} width="90%">
                            <BarChart
                                data={formattedData}
                                layout="horizontal"
                                margin={{ left: 50 }}
                                barSize={BAR_HEIGHT}
                            >
                                <YAxis domain={[0, 100]} type="number" />
                                <XAxis
                                    type="category"
                                    dataKey="name"
                                    interval={0}
                                    height={110}
                                    tick={<NfmCustomTick />}
                                />
                                <Tooltip
                                    payload={formattedData}
                                    formatter={lqasNfmTooltipFormatter}
                                    itemStyle={{ color: 'black' }}
                                />
                                <Bar dataKey="value" minPointSize={3}>
                                    {formattedData.map((_entry, index) => {
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={blue[500]}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </>
            )}
        </>
    );
};
