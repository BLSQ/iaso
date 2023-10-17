import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../../../constants/messages';
import { RoundSelection, SelectPeriod, Side } from './types';
import { FAIL_COLOR, OK_COLOR } from '../../../../styles/constants';

export const useOptions = (): DropdownOptions<string>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.latest),
                value: 'latest',
            },
            {
                label: formatMessage(MESSAGES.penultimate),
                value: 'penultimate',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 0`,
                value: '0',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 1`,
                value: '1',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 2`,
                value: '2',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 3`,
                value: '3',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 4`,
                value: '4',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 5`,
                value: '5',
            },
            {
                label: `${formatMessage(MESSAGES.round)} 6`,
                value: '6',
            },
        ];
    }, [formatMessage]);
};

export const periodOptions: SelectPeriod[] = [
    '3months',
    '6months',
    '9months',
    '12months',
];

export const usePeriodOptions = (): DropdownOptions<SelectPeriod>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return periodOptions.map(option => {
            return {
                label: formatMessage(MESSAGES[option]),
                value: option,
            };
        });
    }, [formatMessage]);
};

export const useLegendItems = (
    displayedShape: string,
): {
    label: string;
    value: string;
    color: string;
}[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const passed =
            displayedShape === 'country'
                ? formatMessage(MESSAGES.countryPassing)
                : formatMessage(MESSAGES.passing);
        const failed =
            displayedShape === 'country'
                ? formatMessage(MESSAGES.countryFailing)
                : formatMessage(MESSAGES.failing);
        return [
            {
                label: passed,
                value: passed,
                color: OK_COLOR,
            },
            {
                label: failed,
                value: failed,
                color: FAIL_COLOR,
            },
        ];
    }, [displayedShape, formatMessage]);
};

export const getRound = (
    rounds: string | undefined,
    side: Side,
): RoundSelection => {
    if (!rounds) {
        if (side === 'left') return 'penultimate';
        return 'latest';
    }
    const [leftRound, rightRound] = rounds.split(',');
    if (side === 'left') {
        const parsedValue = parseInt(leftRound, 10);
        if (Number.isInteger(parsedValue)) {
            return parsedValue;
        }
        return leftRound as RoundSelection;
    }
    const parsedValue = parseInt(rightRound, 10);
    if (Number.isInteger(parsedValue)) {
        return parsedValue;
    }
    return rightRound as RoundSelection;
};
