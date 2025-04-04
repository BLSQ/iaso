import React, { ReactElement } from 'react';
import { Moment } from 'moment';

import { EmptyCell } from '../cells/Empty';
import { MappedCampaign } from '../types';

export const isStartOfWeek = (date: Moment): boolean => date.isoWeekday() === 1; // 1 is Monday
export const isEndOfWeek = (date: Moment): boolean => date.isoWeekday() === 7; // 7 is Sunday

export const getEmptyCellBetweenTwoDates = (
    startDate: Moment,
    endDate: Moment,
    cells: ReactElement[],
    currentWeekIndex: number,
): ReactElement[] => {
    const result: ReactElement[] = [];

    let spans = 0;
    cells.forEach(c => {
        spans += c.props.colSpan;
    });

    spans = Math.floor(spans / 7);
    // get next monday after startDate
    let nextMonday;
    let daysCountBefore = 0;
    if (!isEndOfWeek(startDate)) {
        nextMonday = startDate.clone().add(1, 'week').startOf('isoWeek');
        daysCountBefore = nextMonday.diff(startDate, 'days') || 0;
    } else {
        nextMonday = startDate.add(1, 'day').clone();
    }
    // get days between startDate and next monday
    if (daysCountBefore > 0) {
        spans += 1;
        result.push(
            <EmptyCell
                key={`empty-cell-${startDate}-${daysCountBefore}`}
                colSpan={daysCountBefore}
                isCurrentWeek={spans === currentWeekIndex}
            />,
        );
    }
    // get last sunday before endDate
    let lastSunday;
    let daysCountAfter = 0;
    if (!isStartOfWeek(endDate)) {
        lastSunday = endDate.clone().subtract(1, 'week').endOf('isoWeek');
        daysCountAfter = endDate.diff(lastSunday, 'days') || 0;
    } else {
        lastSunday = endDate.subtract(1, 'day').clone();
    }
    // get weeks between next monday and last sunday
    const weeksCount =
        lastSunday.add(1, 'day').diff(nextMonday.subtract(1, 'day'), 'weeks') ||
        0;
    if (weeksCount > 0) {
        Array(weeksCount)
            .fill(null)
            .forEach((_, i) => {
                spans += 1;
                result.push(
                    <EmptyCell
                        key={`empty-cell-week-${weeksCount}-end-${i}`}
                        colSpan={7}
                        isCurrentWeek={spans === currentWeekIndex}
                    />,
                );
            });
    }
    // get days between last sunday and end date
    if (daysCountAfter > 0) {
        spans += 1;
        result.push(
            <EmptyCell
                key={`empty-cell-${endDate}-${daysCountAfter}`}
                colSpan={daysCountAfter}
                isCurrentWeek={spans === currentWeekIndex}
            />,
        );
    }
    return result;
};

export const drawEmptyFirstCells = ({
    startDate,
    firstMonday,
    currentWeekIndex,
    id,
}: {
    startDate: Moment;
    firstMonday: Moment;
    currentWeekIndex: number;
    id: string;
}): ReactElement[] => {
    const result: ReactElement[] = [];
    if (!startDate.isSame(firstMonday, 'day')) {
        const monday = startDate.clone().startOf('isoWeek');
        const extraDays = startDate.clone().diff(monday, 'days');
        const fullWeeks = monday.diff(firstMonday, 'weeks');
        if (fullWeeks > 0) {
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
        }
        if (extraDays) {
            result.push(
                <EmptyCell
                    key={`empty-cell-${id}-start-${startDate}`}
                    colSpan={extraDays}
                    isCurrentWeek={result.length + 1 === currentWeekIndex}
                />,
            );
        }
    }
    return result;
};

export const isDateInRange = (
    date: Moment,
    firstMonday: Moment,
    lastSunday: Moment,
) =>
    Boolean(date) &&
    date.isSameOrBefore(lastSunday, 'day') &&
    date.isSameOrAfter(firstMonday, 'day');

const getEmptyCellsData = (
    endDate: Moment,
    lastSunday: Moment,
): { extraDays: number; fullWeeks: number } => {
    let sunday: Moment;
    if (endDate.isAfter(lastSunday)) {
        return { extraDays: 0, fullWeeks: 0 };
    }
    if (endDate.weekday() !== 7) {
        sunday = endDate.clone().endOf('isoWeek');
    } else {
        sunday = endDate.clone();
    }
    const extraDays = sunday.clone().diff(endDate, 'days');
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
    currentWeekIndex,
    id,
}: {
    cells: ReactElement[];
    extraDays: number;
    fullWeeks: number;
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
                key={`empty-cell-${id}-end`}
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
                    key={`empty-cell-week-${id}-end-${i}-${spans}`}
                    colSpan={7}
                    isCurrentWeek={spans === currentWeekIndex}
                />,
            );
        });
    return cells;
};
export const addRemainingEmptyCells = ({
    cells,
    dateUntilNextRound,
    lastSunday,
    campaign,
    currentWeekIndex,
}: {
    cells: ReactElement[];
    dateUntilNextRound: Moment;
    lastSunday: Moment;
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
        currentWeekIndex,
        id,
    });
};
