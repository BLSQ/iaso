import { useMemo } from 'react';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { LqasImCampaign } from '../../../../constants/types';
import { accessNfmStats } from '../LqasIm';

type Params = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    type: 'lqas' | 'im';
    selectedRounds: [number, number];
};

const translateTitle =
    (formatMessage: IntlFormatMessage) =>
    (count: number): string =>
        `${formatMessage(MESSAGES.childrenNfmAbsent)}: ${count}`;

type CalcParams = {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: number;
    accessor: string;
};

const calculateChildrenAbsent = ({
    data,
    campaign,
    round,
    accessor,
}: CalcParams): number => {
    if (!data || !campaign || (data && !data[campaign])) return 0;
    return accessNfmStats(data[campaign], round)[accessor] ?? 0;
};

export const useRfaTitle = ({
    data,
    campaign,
    type,
    selectedRounds,
}: Params): string[] => {
    const { formatMessage } = useSafeIntl();
    const makeTitle = translateTitle(formatMessage);
    const accessor = type === 'lqas' ? 'childabsent' : 'Tot_child_Absent_HH';
    const childrenAbsentLeft = calculateChildrenAbsent({
        data,
        campaign,
        round: selectedRounds[0],
        accessor,
    });
    const childrenAbsentRight = calculateChildrenAbsent({
        data,
        campaign,
        round: selectedRounds[1],
        accessor,
    });
    return useMemo(
        () => [makeTitle(childrenAbsentLeft), makeTitle(childrenAbsentRight)],
        [makeTitle, childrenAbsentLeft, childrenAbsentRight],
    );
};
