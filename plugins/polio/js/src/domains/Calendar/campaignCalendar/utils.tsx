/* eslint-disable react/no-array-index-key */
import moment, { Moment } from 'moment';
import React, { ReactElement } from 'react';
import { colsCount, dateFormat } from './constants';

import { Campaign } from '../../../constants/types';
import { CampaignDurationCell } from './cells/CampaignDuration';
import { EmptyCell } from './cells/Empty';
import { RoundCell } from './cells/RoundCell';
import {
    CalendarData,
    CalendarRound,
    MappedCampaign,
    MonthHeader,
    WeekHeader,
    YearHeader,
} from './types';

const getEmptyCellsData = (
    endRoundDate: Moment,
    lastSunday: Moment,
): { extraDays: number; fullWeeks: number } => {
    let sunday: Moment;
    if (endRoundDate.isAfter(lastSunday)) {
        return { extraDays: 0, fullWeeks: 0 };
    }
    if (endRoundDate.weekday() !== 7) {
        sunday = endRoundDate.clone().endOf('isoWeek');
    } else {
        sunday = endRoundDate.clone();
    }
    const extraDays = sunday.clone().diff(endRoundDate, 'days');
    const fullWeeks = lastSunday.diff(sunday, 'weeks');
    return {
        extraDays,
        fullWeeks,
    };
};
const getEmptyCells = ({
    cells,
    extraDays,
    fullWeeks,
    round,
    currentWeekIndex,
    id,
}: {
    cells: ReactElement[];
    extraDays: number;
    fullWeeks: number;
    round: CalendarRound;
    currentWeekIndex: number;
    id: string;
}) => {
    let spans = 0;
    cells.forEach(c => {
        spans += c.props.colSpan;
    });
    spans = Math.floor(spans / 7);
    if (extraDays) {
        spans += 1;
        cells.push(
            <EmptyCell
                key={`empty-cell-${id}-end-${round.end}-${round.number}`}
                colSpan={extraDays}
                isCurrentWeek={spans === currentWeekIndex}
            />,
        );
    }
    const weeks = fullWeeks >= 0 ? fullWeeks : 0;
    Array(weeks)
        .fill(null)
        .forEach((_, i) => {
            spans += 1;
            cells.push(
                <EmptyCell
                    key={`empty-cell-${id}-end-${i}-${round.number}`}
                    colSpan={7}
                    isCurrentWeek={spans === currentWeekIndex}
                />,
            );
        });
    return cells;
};

const getCalendarData = (currentMonday: Moment): CalendarData => {
    const todayMonday = moment().startOf('isoWeek');
    const currentWeek = {
        year: todayMonday.format('YYYY'),
        month: todayMonday.format('MMM'),
        value: todayMonday.format('DD'),
    };
    const firstMonday = currentMonday.clone().subtract(3, 'week');
    const lastSunday = currentMonday
        .clone()
        .add(colsCount - 4, 'week')
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
    Array(colsCount)
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

const isDateInRange = (date: Moment, firstMonday: Moment, lastSunday: Moment) =>
    Boolean(date) &&
    date.isSameOrBefore(lastSunday, 'day') &&
    date.isSameOrAfter(firstMonday, 'day');

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

const filterCampaigns = (
    allCampaigns: MappedCampaign[],
    firstMonday: Moment,
    lastSunday: Moment,
): MappedCampaign[] => {
    return allCampaigns.filter(campaign => {
        const { rounds } = campaign;
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

        return isRoundVisible || isLastRoundVisible;
    });
};

const mapCampaigns = (allCampaigns: Campaign[]): MappedCampaign[] => {
    return allCampaigns.map(c => {
        const rounds = c.rounds.map((round, index) => {
            const nextRound = c.rounds[index + 1];
            const start = round.started_at
                ? moment(round.started_at, dateFormat)
                : undefined;
            const end = round.ended_at
                ? moment(round.ended_at, dateFormat)
                : undefined;
            const hasNextRound = nextRound && end && nextRound.started_at;
            const weeksCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'weeks')
                : 0;

            const daysCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'days')
                : 0;
            const mappedRound = {
                ...round,
                start,
                end,
                weeksCount,
                daysCount,
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
            separateScopesPerRound: c.separate_scopes_per_round,
            scopes: c.scopes,
        };
    });
};

const addCellsBeforeRound = ({
    id,
    cells,
    currentWeekIndex,
    firstMonday,
    lastSunday,
    round,
    index,
    previousRound,
    startInRange,
}: {
    id: string;
    cells: ReactElement[];
    currentWeekIndex: number;
    firstMonday: Moment;
    lastSunday: Moment;
    round: CalendarRound;
    index: number;
    previousRound?: CalendarRound;
    startInRange: boolean;
}) => {
    const result = [...cells];
    if (index === 0) {
        // if first round is not starting on the first cell, populate with empty cell
        if (startInRange && round.start) {
            if (!round.start.isSame(firstMonday, 'day')) {
                const monday = round.start.clone().startOf('isoWeek');
                const extraDays = round.start.clone().diff(monday, 'days');
                const fullWeeks = monday.diff(firstMonday, 'weeks');
                Array(fullWeeks)
                    .fill(null)
                    .forEach((_, i) => {
                        result.push(
                            <EmptyCell
                                key={`empty-cell-${id}-start-${i}`}
                                colSpan={7}
                                isCurrentWeek={
                                    result.length + 1 === currentWeekIndex
                                }
                            />,
                        );
                    });
                if (extraDays) {
                    result.push(
                        <EmptyCell
                            key={`empty-cell-${id}-start-${round.start}`}
                            colSpan={extraDays}
                            isCurrentWeek={
                                result.length + 1 === currentWeekIndex
                            }
                        />,
                    );
                }
            }
        }
    } else if (
        // if previous round end date is not in range, calculate number of cells to firstMonday and draw campaign duration cells
        previousRound?.end &&
        !isDateInRange(previousRound.end, firstMonday, lastSunday) &&
        startInRange &&
        round.start
    ) {
        const campaignDays = round.start.diff(firstMonday, 'days');
        result.push(
            <CampaignDurationCell
                key={`campaign-duration-${id}-round-${round.id}`}
                colSpan={campaignDays}
                weeksCount={previousRound.weeksCount || 0}
            />,
        );
    }
    return result;
};

const addRoundCell = ({
    campaign,
    cells,
    round,
    firstMonday,
    lastSunday,
    startInRange,
    endInRange,
}: {
    campaign: MappedCampaign;
    cells: ReactElement[];
    round: CalendarRound;
    firstMonday: Moment;
    lastSunday: Moment;
    startInRange: boolean;
    endInRange: boolean;
}) => {
    let colSpan = 1;
    const { id } = campaign;
    const result = [...cells];

    const startAndEndInRange = startInRange && endInRange;

    const onlyStartInRange = !endInRange && startInRange;

    const onlyEndInRange = !startInRange && endInRange;

    if (round.end) {
        if (startAndEndInRange) {
            // if both start and end date are in range use diff between dates for length of cells
            colSpan = round.end.clone().add(1, 'day').diff(round.start, 'days');
            // else if start is not in range calculate diff with firstmonday
        } else if (onlyEndInRange) {
            colSpan = round.end.clone().add(1, 'day').diff(firstMonday, 'days');
            // else if end is not in range calculate diff with lastSunday
        } else if (onlyStartInRange) {
            colSpan = round.end.clone().add(3, 'day').diff(lastSunday, 'days');
        }
    }
    result.push(
        <RoundCell
            key={`round${round.number}Cost-campaign-${id}`}
            colSpan={colSpan}
            campaign={campaign}
            round={round}
        />,
    );
    return result;
};

const addBufferCell = ({
    id,
    round,
    cells,
    dateUntilNextRoundInRange,
    lastSunday,
    endInRange,
    dateUntilNextRound,
    firstMonday,
    rounds,
    index,
}: {
    id: string;
    round: CalendarRound;
    cells: ReactElement[];
    dateUntilNextRoundInRange: boolean;
    lastSunday: Moment;
    endInRange: boolean;
    dateUntilNextRound?: Moment;
    firstMonday: Moment;
    rounds: CalendarRound[];
    index: number;
}) => {
    // draw campaign duration cells
    const result = [...cells];
    let roundInterval =
        round.daysCount && round.daysCount > 0 ? round.daysCount - 1 : 0;
    // if campaign days count is not in range calculate diff with last sunday campaign
    if (!dateUntilNextRoundInRange) {
        roundInterval = lastSunday.clone().diff(round.end, 'days');
    }
    // if last round end date is not in range calculate diff with first monday and campaign days
    if (!endInRange && dateUntilNextRoundInRange && dateUntilNextRound) {
        roundInterval = dateUntilNextRound
            .clone()
            .add(1, 'day')
            .diff(firstMonday, 'days');
    }
    const nextRound = rounds[index + 1];
    const hasNextRound = Boolean(
        nextRound && nextRound.started_at && nextRound.ended_at,
    );
    if (hasNextRound) {
        result.push(
            <CampaignDurationCell
                key={`campaign-duration-${id}-round-${round.number}`}
                colSpan={roundInterval}
                weeksCount={round.weeksCount || 0}
            />,
        );
    }
    return result;
};

const addRemainingEmptyCells = ({
    cells,
    dateUntilNextRound,
    lastSunday,
    round,
    campaign,
    currentWeekIndex,
}: {
    cells: ReactElement[];
    dateUntilNextRound: Moment;
    lastSunday: Moment;
    round: CalendarRound;
    campaign: MappedCampaign;
    currentWeekIndex: number;
}) => {
    const { id } = campaign;
    const cellsData = getEmptyCellsData(dateUntilNextRound, lastSunday);
    const { extraDays, fullWeeks } = cellsData;

    return getEmptyCells({
        cells,
        extraDays,
        fullWeeks,
        round,
        currentWeekIndex,
        id,
    });
};

const getCells = (
    campaign: MappedCampaign,
    currentWeekIndex: number,
    firstMonday: Moment,
    lastSunday: Moment,
): ReactElement[] => {
    let cells: ReactElement[] = [];
    const { id, rounds } = campaign;
    rounds.forEach((round, index) => {
        // for one round
        const previousRound = rounds[index - 1];
        const startInRange = round.start
            ? isDateInRange(round.start, firstMonday, lastSunday)
            : false;
        const endInRange = round.end
            ? isDateInRange(round.end, firstMonday, lastSunday)
            : false;

        let dateUntilNextRound = round.end
            ?.clone()
            .add(round.daysCount, 'days');

        let dateUntilNextRoundInRange =
            !!dateUntilNextRound &&
            isDateInRange(dateUntilNextRound, firstMonday, lastSunday);

        const startAndEndInRange = startInRange && endInRange;

        const onlyStartInRange = !endInRange && startInRange;

        const onlyEndInRange = !startInRange && endInRange;

        const isRoundIntervalVisible =
            !endInRange &&
            !startInRange &&
            dateUntilNextRoundInRange &&
            index === rounds.length - 1;

        const isRoundVisible =
            startAndEndInRange || onlyStartInRange || onlyEndInRange;

        cells = addCellsBeforeRound({
            id,
            cells,
            round,
            index,
            startInRange,
            previousRound,
            firstMonday,
            lastSunday,
            currentWeekIndex,
        });

        if (round.start && round.end) {
            if (isRoundVisible) {
                cells = addRoundCell({
                    campaign,
                    cells,
                    round,
                    firstMonday,
                    lastSunday,
                    startInRange,
                    endInRange,
                });
            }

            if (isRoundVisible || isRoundIntervalVisible) {
                cells = addBufferCell({
                    id,
                    cells,
                    round,
                    dateUntilNextRoundInRange,
                    lastSunday,
                    endInRange,
                    dateUntilNextRound,
                    firstMonday,
                    rounds,
                    index,
                });
            }

            // if it's last round draw empty cells
            if (
                index === rounds.length - 1 &&
                dateUntilNextRoundInRange &&
                dateUntilNextRound
            ) {
                cells = addRemainingEmptyCells({
                    cells,
                    dateUntilNextRound,
                    lastSunday,
                    round,
                    campaign,
                    currentWeekIndex,
                });
            }
        } else if (previousRound.end) {
            // add an additional day for positioning if the next round has a start date
            if (round.started_at && previousRound.daysCount) {
                dateUntilNextRound = previousRound.end
                    ?.clone()
                    .add(previousRound.daysCount - 1, 'days');
                // if next round has empty dates just clone previousRound.end
            } else {
                dateUntilNextRound = previousRound.end?.clone();
            }

            dateUntilNextRoundInRange = isDateInRange(
                dateUntilNextRound,
                firstMonday,
                lastSunday,
            );

            const previousEndVisible = isDateInRange(
                previousRound.end,
                firstMonday,
                lastSunday,
            );
            if (dateUntilNextRoundInRange && !previousEndVisible) {
                cells = addBufferCell({
                    id,
                    cells,
                    round: { ...round, end: dateUntilNextRound },
                    dateUntilNextRoundInRange,
                    lastSunday,
                    endInRange: false,
                    dateUntilNextRound,
                    firstMonday,
                    rounds,
                    index,
                });
            }
            cells = addRemainingEmptyCells({
                cells,
                dateUntilNextRound,
                lastSunday,
                round,
                campaign,
                currentWeekIndex,
            });
        }
    });
    return cells;
};

export { filterCampaigns, getCalendarData, getCells, mapCampaigns };
