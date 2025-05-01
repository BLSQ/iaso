import React, { ReactElement } from 'react';
import { Moment } from 'moment';

import { CampaignDurationCell } from '../cells/CampaignDuration';
import { RoundCell } from '../cells/RoundCell';
import { CalendarRound, MappedCampaign, PeriodType } from '../types';
import {
    drawEmptyFirstCells,
    getEmptyCellBetweenTwoDates,
    isDateInRange,
    addRemainingEmptyCells,
} from './index';

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
    periodType,
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
    periodType: PeriodType;
}) => {
    const result = [...cells];
    if (index === 0) {
        // if first round is not starting on the first cell, populate with empty cell
        if (startInRange && round.start) {
            const emptyCells = drawEmptyFirstCells({
                startDate: round.start,
                firstMonday,
                currentWeekIndex,
                id,
            });
            result.push(...emptyCells);
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
                periodType={periodType}
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
    periodType,
}: {
    campaign: MappedCampaign;
    cells: ReactElement[];
    round: CalendarRound;
    firstMonday: Moment;
    lastSunday: Moment;
    startInRange: boolean;
    endInRange: boolean;
    periodType: PeriodType;
}) => {
    let colSpan = 1;
    const { id } = campaign;
    const result = [...cells];

    const startAndEndInRange = startInRange && endInRange;

    const onlyStartInRange = !endInRange && startInRange;

    const onlyEndInRange = !startInRange && endInRange;

    if (round.end && round.start) {
        if (startAndEndInRange) {
            // if both start and end date are in range use diff between dates for length of cells
            colSpan = round.end.clone().add(1, 'day').diff(round.start, 'days');
            // else if start is not in range calculate diff with firstmonday
        } else if (onlyEndInRange) {
            colSpan = round.end.clone().add(1, 'day').diff(firstMonday, 'days');
            // else if end is not in range calculate diff with lastSunday
        } else if (onlyStartInRange) {
            colSpan = Math.abs(
                round.start.clone().subtract(1, 'day').diff(lastSunday, 'days'),
            );
        }
    }
    result.push(
        <RoundCell
            key={`round${round.number}Cost-campaign-${id}`}
            colSpan={colSpan}
            campaign={campaign}
            round={round}
            periodType={periodType}
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
    periodType,
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
    periodType: PeriodType;
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
                periodType={periodType}
            />,
        );
    }
    return result;
};

const getRoundRow = (
    originalCells: ReactElement[],
    round: CalendarRound,
    index: number,
    firstMonday: Moment,
    lastSunday: Moment,
    currentWeekIndex: number,
    periodType: PeriodType,
    campaign: MappedCampaign,
): ReactElement[] => {
    // for one round
    const { id, rounds } = campaign;
    const previousRound = rounds[index - 1];
    const startInRange = round.start
        ? isDateInRange(round.start, firstMonday, lastSunday)
        : false;
    const endInRange = round.end
        ? isDateInRange(round.end, firstMonday, lastSunday)
        : false;

    let dateUntilNextRound = round.end?.clone().add(round.daysCount, 'days');

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

    let cells = addCellsBeforeRound({
        id,
        cells: originalCells,
        round,
        index,
        startInRange,
        previousRound,
        firstMonday,
        lastSunday,
        currentWeekIndex,
        periodType,
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
                periodType,
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
                periodType,
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
                periodType,
            });
        }
        cells = addRemainingEmptyCells({
            cells,
            dateUntilNextRound,
            lastSunday,
            campaign,
            currentWeekIndex,
        });
    }
    return cells;
};

export const getRoundsCells = (
    campaign: MappedCampaign,
    currentWeekIndex: number,
    firstMonday: Moment,
    lastSunday: Moment,
    periodType: PeriodType,
): ReactElement[] => {
    let cells: ReactElement[] = [];
    const { rounds } = campaign;
    rounds.forEach((round, index) => {
        cells = getRoundRow(
            cells,
            round,
            index,
            firstMonday,
            lastSunday,
            currentWeekIndex,
            periodType,
            campaign,
        );
    });

    if (cells.length === 0) {
        const emptyCells = getEmptyCellBetweenTwoDates(
            firstMonday,
            lastSunday,
            cells,
            currentWeekIndex,
        );
        cells.push(...emptyCells);
    }
    return cells;
};
