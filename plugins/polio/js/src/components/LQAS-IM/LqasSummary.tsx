/* eslint-disable react/require-default-props */
import { Typography } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import { RoundString } from '../../constants/types';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import {
    convertStatToPercent,
    getLqasStatsForRound,
    makeCaregiversRatio,
} from '../../pages/LQAS/utils';

type Props = {
    campaign?: string;
    round: RoundString;
};

export const LqasSummary: FunctionComponent<Props> = ({ campaign, round }) => {
    const { data } = useConvertedLqasImData('lqas');
    const summary = useMemo(() => {
        const [passed, failed, disqualified] = getLqasStatsForRound(
            data,
            campaign,
            round,
        );
        const evaluated: number =
            passed.length + failed.length + disqualified.length;
        const ratePassed: string = convertStatToPercent(
            passed.length,
            evaluated,
        );
        const caregiversRatio =
            data && campaign ? makeCaregiversRatio(data[campaign][round]) : '';

        return {
            evaluated,
            passed: passed.length,
            ratePassed,
            caregiversRatio,
        };
    }, [data, campaign, round]);

    return (
        <>
            {data && campaign && (
                <Typography variant="h6">
                    {`${summary.evaluated} ${summary.passed} ${summary.ratePassed}${summary.caregiversRatio}`}
                </Typography>
            )}
        </>
    );
};
