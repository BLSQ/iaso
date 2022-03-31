import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../constants/messages';
import { IntlFormatMessage, LqasImCampaign } from '../constants/types';
import { makeRatioUnmarked } from '../utils/LqasIm';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    type: 'lqas' | 'im';
};

const translateTitle = (formatMessage: IntlFormatMessage) => (ratio: string) =>
    `${formatMessage(MESSAGES.childrenNoMark)}: ${ratio}`;

export const useNfmTitle = ({ data, campaign, type }: Params): string[] => {
    const { formatMessage } = useSafeIntl();
    const makeTitle = translateTitle(formatMessage);
    const [ratioUnmarkedRound1, ratioUnmarkedRound2] = makeRatioUnmarked({
        data,
        campaign,
        type,
    });

    return useMemo(
        () => [makeTitle(ratioUnmarkedRound1), makeTitle(ratioUnmarkedRound2)],
        [makeTitle, ratioUnmarkedRound1, ratioUnmarkedRound2],
    );
};
