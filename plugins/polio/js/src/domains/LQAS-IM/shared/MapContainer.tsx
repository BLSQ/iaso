import React, { FunctionComponent } from 'react';

import { Paper, Divider, Box } from '@material-ui/core';

import { LqasImMap } from './LqasImMap';

import { LqasSummary } from './LqasSummary';
import { LqasImMapHeader, LqasImRefDate } from './LqasImMapHeader';
import { Campaign, ConvertedLqasImData } from '../../../constants/types';
import { ImSummary } from '../IM/ImSummary';
import { findCampaignRound } from '../../../utils';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    round: number;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    type: 'lqas' | 'imIHH' | 'imOHH' | 'imGlobal';
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: number) => void;
};

const determineLqasImDates = (
    campaign,
    round: number,
    type,
):
    | { start: LqasImRefDate; end: LqasImRefDate }
    | Record<string, LqasImRefDate> => {
    if (!campaign) return {};
    const roundData = findCampaignRound(campaign, round);
    if (!roundData) {
        console.warn(
            `No data found for round ${round} in campaign ${campaign.obr_name}`,
        );
        return {};
    }
    const lqasImStart =
        type === 'lqas' ? roundData.lqas_started_at : roundData.im_started_at;
    const lqasImEnd =
        type === 'lqas' ? roundData.lqas_ended_at : roundData.im_ended_at;
    const roundStart = roundData.started_at;
    const roundEnd = roundData.ended_at;
    const startDate = lqasImStart ?? roundStart;
    const endDate = lqasImEnd ?? roundEnd;
    // TODO handle endDate is before startDate
    return {
        start: {
            date: startDate,
            isDefault: !lqasImStart,
        },
        end: {
            date: endDate,
            isDefault: !lqasImEnd,
        },
    };
};

const aggregateScopes = scopes => {
    return scopes.map(scope => scope.group.org_units).flat();
};

const computeScopeCounts = (
    campaign?: Campaign,
    roundNumber?: number,
): number => {
    if (!campaign) return 0;
    if (campaign.separate_scopes_per_round) {
        const round = campaign.rounds.find(r => r.number === roundNumber);
        const scope = round ? aggregateScopes(round.scopes) : [];
        return scope.length;
    }
    return aggregateScopes(campaign?.scopes ?? []).length;
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
    options,
    onRoundChange,
}) => {
    const campaignObject = campaigns.filter(
        (c: Record<string, unknown>) => c.obr_name === campaign,
    )[0] as Campaign;
    const { start: startDate, end: endDate } = determineLqasImDates(
        campaignObject,
        round,
        type,
    );
    const scopeCount = computeScopeCounts(campaignObject, round);
    return (
        <Paper elevation={paperElevation}>
            <Box mb={2}>
                <LqasImMapHeader
                    round={round}
                    startDate={startDate}
                    endDate={endDate}
                    options={options}
                    onRoundSelect={onRoundChange}
                />
            </Box>
            <Divider />
            {type === 'lqas' && (
                <LqasSummary
                    round={round}
                    campaign={campaign}
                    data={data}
                    scopeCount={scopeCount}
                />
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
