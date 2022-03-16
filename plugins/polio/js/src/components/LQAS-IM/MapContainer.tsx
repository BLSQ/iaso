import React, { FunctionComponent } from 'react';

import { Paper, Divider } from '@material-ui/core';

import { LqasImMap } from './LqasImMap';

import { LqasSummary } from './LqasSummary';
import { LqasImMapHeader, LqasImRefDate } from './LqasImMapHeader';
import { RoundString, ConvertedLqasImData } from '../../constants/types';
import { ImSummary } from './ImSummary';

type Props = {
    round: RoundString;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    type: 'lqas' | 'imIHH' | 'imOHH' | 'imGlobal';
};

const determineLqasImDates = (
    campaign,
    round: RoundString,
    type,
):
    | { start: LqasImRefDate; end: LqasImRefDate }
    | Record<string, LqasImRefDate> => {
    if (!campaign) return {};
    const roundData =
        round === 'round_1' ? campaign.round_one : campaign.round_two;
    const lqasImStart =
        type === 'lqas' ? roundData.lqas_started_at : roundData.im_started_at;
    const lqasImEnd = type === 'lqas' ? roundData.ended_at : roundData.ended_at;
    const roundStart = roundData.started_at;
    const roundEnd = roundData.ended_at;
    const startDate = lqasImStart ?? roundStart;
    const endDate = lqasImEnd ?? roundEnd;
    // TODO handle endDate is before startDate
    return {
        start: {
            date: startDate,
            isDefault: !startDate === lqasImStart,
        },
        end: { date: endDate, isDefault: !endDate === lqasImEnd },
    };
};

export const MapContainer: FunctionComponent<Props> = ({
    round,
    campaign,
    campaigns,
    country,
    data,
    isFetching,
    debugData,
    paperElevation,
    type,
}) => {
    const campaignObject = campaigns.filter(c => c.obr_name === campaign)[0];
    console.log('campaign', campaignObject);
    const { start: startDate, end: endDate } = determineLqasImDates(
        campaignObject,
        round,
        type,
    );
    return (
        <Paper elevation={paperElevation}>
            <LqasImMapHeader
                round={round}
                startDate={startDate}
                endDate={endDate}
            />
            <Divider />
            {type === 'lqas' && (
                <LqasSummary round={round} campaign={campaign} data={data} />
            )}
            {type !== 'lqas' && (
                <ImSummary
                    round={round}
                    campaign={campaign}
                    data={data}
                    type={type}
                />
            )}
            <LqasImMap
                round={round}
                selectedCampaign={campaign}
                type={type}
                countryId={parseInt(country, 10)}
                campaigns={campaigns}
                data={data}
                isFetching={isFetching}
                disclaimerData={debugData}
            />
        </Paper>
    );
};
