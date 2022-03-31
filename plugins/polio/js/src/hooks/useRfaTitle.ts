import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import {
    IntlFormatMessage,
    LqasImCampaign,
    NfmRoundString,
} from '../constants/types';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    type: 'lqas' | 'im';
};

const translateTitle =
    (formatMessage: IntlFormatMessage) =>
    (count: number): string =>
        `${formatMessage(MESSAGES.childrenNfmAbsent)}: ${count}`;

export const useRfaTitle = ({ data, campaign, type }: Params): string[] => {
    const { formatMessage } = useSafeIntl();
    const makeTitle = translateTitle(formatMessage);
    const accessor = type === 'lqas' ? 'childabsent' : 'Tot_child_Absent_HH';
    const childrenAbsentRound1 =
        data && campaign && data[campaign]
            ? data[campaign][NfmRoundString.round_1][accessor]
            : 0;
    const childrenAbsentRound2 =
        data && campaign && data[campaign]
            ? data[campaign][NfmRoundString.round_2][accessor]
            : 0;
    return useMemo(
        () => [
            makeTitle(childrenAbsentRound1),
            makeTitle(childrenAbsentRound2),
        ],
        [makeTitle, childrenAbsentRound1, childrenAbsentRound2],
    );
};
