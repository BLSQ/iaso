import moment from 'moment';
import { getLocaleDateFormat } from 'Iaso/utils/dates';

export const formatRoundDate = (
    date: string | null | undefined,
): string | undefined => {
    if (!date) {
        return undefined;
    }
    const parsed = moment(date);
    if (!parsed.isValid()) {
        return undefined;
    }
    return parsed.format(getLocaleDateFormat('L'));
};

export const formatRoundDateRange = (
    startedAt: string | null | undefined,
    endedAt: string | null | undefined,
    toLabel: string,
): string | undefined => {
    const start = formatRoundDate(startedAt);
    const end = formatRoundDate(endedAt);
    if (start && end) {
        return `${start} ${toLabel} ${end}`;
    }
    return start || end;
};
