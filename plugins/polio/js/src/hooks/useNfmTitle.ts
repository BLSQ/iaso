import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../constants/messages';
import { LqasImCampaign } from '../constants/types';
import { makeRatioUnmarked } from '../utils/LqasIm';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    type: 'lqas' | 'im';
    selectedRounds: [number, number];
};

const translateTitle = (formatMessage: IntlFormatMessage) => (ratio: string) =>
    `${formatMessage(MESSAGES.childrenNoMark)}: ${ratio}`;

export const useNfmTitle = ({
    data,
    campaign,
    type,
    selectedRounds,
}: Params): string[] => {
    const { formatMessage } = useSafeIntl();
    const makeTitle = translateTitle(formatMessage);
    const [ratioUnmarkedRound1, ratioUnmarkedRound2] = makeRatioUnmarked({
        data,
        campaign,
        type,
        selectedRounds,
    });

    return useMemo(
        () => [makeTitle(ratioUnmarkedRound1), makeTitle(ratioUnmarkedRound2)],
        [makeTitle, ratioUnmarkedRound1, ratioUnmarkedRound2],
    );
};
