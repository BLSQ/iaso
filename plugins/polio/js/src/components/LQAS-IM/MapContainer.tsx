import React, { FunctionComponent } from 'react';

import { Paper, Divider } from '@material-ui/core';

import { LqasImMap } from './LqasImMap';

import { LqasSummary } from './LqasSummary';
import { LqasImMapHeader } from './LqasImMapHeader';
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
    return (
        <Paper elevation={paperElevation}>
            <LqasImMapHeader round={round} />
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
