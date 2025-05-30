import moment, { Moment } from 'moment';

import { CalendarCampaign } from '../../../../constants/types';
import { colsCounts, dateFormat } from '../constants';
import {
    CalendarData,
    CalendarRound,
    MappedCampaign,
    MonthHeader,
    PeriodType,
    WeekHeader,
    YearHeader,
} from '../types';
import { isDateInRange } from './index';

export const getCalendarData = (
    currentMonday: Moment,
    periodType: PeriodType = 'year',
): CalendarData => {
    const todayMonday = moment().startOf('isoWeek');
    const currentWeek = {
        year: todayMonday.format('YYYY'),
        month: todayMonday.format('MMM'),
        value: todayMonday.format('DD'),
    };
    const columnCount = colsCounts[periodType];
    const firstMonday = currentMonday
        .clone()
        .subtract(Math.floor(columnCount / 2), 'week');
    const lastSunday = currentMonday
        .clone()
        .add(columnCount - (Math.floor(columnCount / 2) + 1), 'week')
        .endOf('isoWeek');
    const headers: {
        years: YearHeader[];
        months: MonthHeader[];
        weeks: WeekHeader[];
    } = {
        years: [],
        months: [],
        weeks: [],
    };
    let currentWeekIndex = -1;
    Array(columnCount)
        .fill(null)
        .forEach((_, i) => {
            const newMonday = firstMonday.clone().add(i, 'week');
            const year = newMonday.format('YYYY');
            if (!headers.years.find(y => y.value === year)) {
                headers.years.push({
                    value: year,
                    daysCount: 0,
                });
            }
            const month = newMonday.format('MMM');
            if (
                !headers.months.find(m => month === m.value && year === m.year)
            ) {
                headers.months.push({
                    year,
                    value: month,
                    daysCount: 0,
                });
            }
            const week = newMonday.format('DD');
            if (
                currentWeek.year === year &&
                currentWeek.month === month &&
                currentWeek.value === week
            ) {
                currentWeekIndex = i + 1;
            }
            const monthIndex = headers.months.findIndex(
                m => month === m.value && year === m.year,
            );
            headers.months[monthIndex].daysCount += 7;
            const yearIndex = headers.years.findIndex(y => year === y.value);
            headers.years[yearIndex].daysCount += 7;
            headers.weeks.push({
                year,
                month,
                value: week,
                monday: newMonday.clone(),
            });
        });
    return {
        headers,
        currentWeekIndex,
        firstMonday,
        lastSunday,
    };
};

const getLastRound = (rounds: CalendarRound[]): CalendarRound => {
    const lastRound = rounds[rounds.length - 1];
    if (lastRound?.started_at && lastRound?.ended_at) {
        return lastRound;
    }
    const lastRoundRemoved = [...rounds].filter((_rnd, index) => {
        return index !== rounds.length - 1;
    });
    if (lastRoundRemoved.length >= 1) {
        return getLastRound(lastRoundRemoved);
    }
    return lastRound;
};
export const filterCampaigns = (
    allCampaigns: MappedCampaign[],
    firstMonday: Moment,
    lastSunday: Moment,
): MappedCampaign[] => {
    return allCampaigns.filter(campaign => {
        const { rounds, subActivities } = campaign;
        const lastRound = getLastRound(rounds);
        const endCampaignDate = lastRound?.end
            ?.clone()
            .add(lastRound.daysCount, 'days');

        const isRoundVisible =
            rounds.filter(
                round =>
                    round.started_at &&
                    round.ended_at &&
                    round.start &&
                    round.end &&
                    (isDateInRange(round.start, firstMonday, lastSunday) ||
                        isDateInRange(round.end, firstMonday, lastSunday)),
            ).length > 0;

        const isLastRoundVisible = endCampaignDate
            ? isDateInRange(endCampaignDate, firstMonday, lastSunday)
            : false;

        const isSubActivityVisible = subActivities.some(
            subActivity =>
                (subActivity.start_date &&
                    isDateInRange(
                        subActivity.start_date,
                        firstMonday,
                        lastSunday,
                    )) ||
                (subActivity.end_date &&
                    isDateInRange(
                        subActivity.end_date,
                        firstMonday,
                        lastSunday,
                    )),
        );

        return isRoundVisible || isLastRoundVisible || isSubActivityVisible;
    });
};

export const mapCampaigns = (
    allCampaigns: CalendarCampaign[],
    firstMonday: Moment,
    lastSunday: Moment,
): MappedCampaign[] => {
    return allCampaigns.map(c => {
        const displayedSubActivities = c.sub_activities
            .sort(
                (a, b) =>
                    new Date(a.start_date).getTime() -
                    new Date(b.start_date).getTime(),
            )
            .map(subActivity => {
                return {
                    ...subActivity,
                    start_date: moment(subActivity.start_date)
                        .hours(0)
                        .minutes(1),
                    end_date: moment(subActivity.end_date)
                        .hours(23)
                        .minutes(59),
                };
            })
            .filter(
                subActivity =>
                    isDateInRange(
                        moment(subActivity.start_date),
                        firstMonday,
                        lastSunday,
                    ) ||
                    isDateInRange(
                        moment(subActivity.end_date),
                        firstMonday,
                        lastSunday,
                    ),
            );
        const rounds = c.rounds.map((round, index) => {
            const nextRound = c.rounds[index + 1];
            const started_at =
                round.started_at === null ? undefined : round.started_at;
            const ended_at =
                round.ended_at === null ? undefined : round.ended_at;
            const start = round.started_at
                ? moment(round.started_at, dateFormat)
                : undefined;
            const end = round.ended_at
                ? moment(round.ended_at, dateFormat)
                : undefined;
            const hasNextRound = nextRound && end && nextRound.started_at;
            const target_population =
                round.target_population != null ? round.target_population : 0;
            const weeksCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'weeks')
                : 0;

            const daysCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'days')
                : 0;

            const hasSubActivities = Boolean(
                displayedSubActivities.find(
                    subActivity => subActivity.round_number === round.number,
                ),
            );
            const subActivities = displayedSubActivities.filter(
                subActivity => subActivity.round_number === round.number,
            );
            const mappedRound = {
                ...round,
                target_population,
                started_at,
                ended_at,
                start,
                end,
                weeksCount,
                daysCount,
                hasSubActivities,
                subActivities,
            };
            if (c.is_preventive && !nextRound?.started_at) {
                return { ...mappedRound, weeksCount: 0, daysCount: 0 };
            }
            return mappedRound;
        });

        return {
            id: c.id,
            name: c.obr_name,
            country: c.top_level_org_unit_name,
            country_id: c.top_level_org_unit_id,
            rounds,
            original: c,
            isPreventive: c.is_preventive,
            isTest: c.is_test,
            onHold: c.on_hold,
            separateScopesPerRound: c.separate_scopes_per_round,
            scopes: c.scopes,
            subActivities: displayedSubActivities,
            hasSubActivities: displayedSubActivities.length > 0,
        };
    });
};
