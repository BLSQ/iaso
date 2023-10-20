import React, { FunctionComponent } from 'react';

import { Paper, Divider, Box } from '@material-ui/core';

import { LqasImMap } from './LqasImMap';

import { LqasSummary } from '../LQAS/CountryOverview/LqasSummary';
import { LqasImMapHeader } from './LqasImMapHeader';
import {
    Campaign,
    ConvertedLqasImData,
    LqasIMtype,
} from '../../../constants/types';
import { ImSummary } from '../IM/ImSummary';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { computeScopeCounts, determineLqasImDates } from './utils';

type Props = {
    round: number;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    type: LqasIMtype;
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: number) => void;
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
                    campaignObrName={campaign}
                    isFetching={isFetching}
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
