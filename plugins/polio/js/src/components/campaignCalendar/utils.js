/* eslint-disable react/no-array-index-key */
import moment from 'moment';
import React from 'react';
import { colsCount, dateFormat, defaultCampaignLength } from './constants';

import { RoundCell } from './cells/RoundCell';
import { CampaignDurationCell } from './cells/CampaignDuration';
import { EmptyCell } from './cells/Empty';

const getEmptyCellsData = (endRoundDate, lastSunday) => {
    let sunday;
    if (endRoundDate.weekday() !== 7) {
        sunday = endRoundDate?.clone().endOf('isoWeek');
    } else {
        sunday = endRoundDate?.clone();
    }
    const extraDays = sunday?.clone().diff(endRoundDate, 'days');
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
}) => {
    let spans = 0;
    cells.forEach(c => {
        spans += c.props.colSpan;
    });
    spans = parseInt(spans / 7, 10);
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
        .fill()
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

const getCalendarData = currentMonday => {
    const todayMonday = moment().startOf('isoWeek');
    const currentWeek = {
        year: todayMonday.format('YYYY'),
        month: todayMonday.format('MMM'),
        value: todayMonday.format('DD'),
    };
    const firstMonday = currentMonday?.clone().subtract(3, 'week');
    const lastSunday = currentMonday
        ?.clone()
        .add(colsCount - 4, 'week')
        .endOf('isoWeek');
    const headers = {
        years: [],
        months: [],
        weeks: [],
    };
    let currentWeekIndex = -1;
    Array(colsCount)
        .fill()
        .forEach((_, i) => {
            const newMonday = firstMonday?.clone().add(i, 'week');
            const year = newMonday.format('YYYY');
            if (!headers.years.find(y => year === y.value))
                if (!headers.years.includes(year)) {
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
                monday: newMonday?.clone(),
            });
        });
    return {
        headers,
        currentWeekIndex,
        firstMonday,
        lastSunday,
    };
};

const isDateInRange = (date, firstMonday, lastSunday) =>
    Boolean(date) &&
    date.isSameOrBefore(lastSunday, 'day') &&
    date.isSameOrAfter(firstMonday, 'day');

const getLastRound = rounds => {
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

const filterCampaigns = (allCampaigns, firstMonday, lastSunday) => {
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
                    (isDateInRange(round.start, firstMonday, lastSunday) ||
                        isDateInRange(round.end, firstMonday, lastSunday)),
            ).length > 0;

        const isLastRoundVisible = isDateInRange(
            endCampaignDate,
            firstMonday,
            lastSunday,
        );

        return isRoundVisible || isLastRoundVisible;
    });
};

const mapCampaigns = allCampaigns => {
    return allCampaigns.map(c => {
        const rounds = c.rounds.map((round, index) => {
            const nextRound = c.rounds[index + 1];
            const start =
                round.started_at && moment(round.started_at, dateFormat);
            const end = round.ended_at && moment(round.ended_at, dateFormat);
            const hasNextRound = nextRound && end && nextRound.started_at;
            const weeksCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'weeks')
                : defaultCampaignLength;
            const daysCount = hasNextRound
                ? moment(nextRound.started_at, dateFormat).diff(end, 'days')
                : defaultCampaignLength * 7;

            const mappedRound = {
                ...round,
                start,
                end,
                weeksCount,
                daysCount,
            };
            if (c.is_preventive && !nextRound?.start) {
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
}) => {
    const result = [...cells];
    if (index === 0) {
        // if first round is not starting on the first cell, populate with empty cell
        if (startInRange) {
            if (!round.start.isSame(firstMonday, 'day')) {
                let monday;
                if (round.start.weekday() !== 1) {
                    monday = round.start?.clone().startOf('isoWeek');
                } else {
                    monday = round.start?.clone();
                }
                const extraDays = round.start?.clone().diff(monday, 'days');
                const fullWeeks = monday.diff(firstMonday, 'weeks');
                Array(fullWeeks)
                    .fill()
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
        startInRange
    ) {
        const campaignDays = round.start.diff(firstMonday, 'days');
        result.push(
            <CampaignDurationCell
                key={`campaign-duration-${id}-round-${round.id}`}
                colSpan={campaignDays}
                hasNextRound
                round={round}
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
}) => {
    let colSpan;
    const { id } = campaign;
    const result = [...cells];

    const startAndEndInRange = startInRange && endInRange;

    const onlyStartInRange = !endInRange && startInRange;

    const onlyEndInRange = !startInRange && endInRange;

    if (startAndEndInRange) {
        // if both start and end date are in range use diff between dates for length of cells
        colSpan = round.end?.clone().add(1, 'day').diff(round.start, 'days');
        // else if start is not in range calculate diff with firstmonday
    } else if (onlyEndInRange) {
        colSpan = round.end?.clone().add(1, 'day').diff(firstMonday, 'days');
        // else if end is not in range calculate diff with lastSunday
    } else if (onlyStartInRange) {
        colSpan = round.end?.clone().add(2, 'day').diff(lastSunday, 'days');
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
}) => {
    // draw campaign duration cells
    const result = [...cells];
    let roundInterval = round.daysCount > 0 ? round.daysCount - 1 : 0;
    // if campaign days count is not in range calculate diff with last sunday campaign
    if (!dateUntilNextRoundInRange) {
        roundInterval = lastSunday?.clone().diff(round.end, 'days');
    }
    // if last round end date is not in range calculate diff with first monday and campaign days
    if (!endInRange && dateUntilNextRoundInRange) {
        roundInterval = dateUntilNextRound
            ?.clone()
            .add(1, 'day')
            .diff(firstMonday, 'days');
    }
    const nextRound = rounds[index + 1];
    result.push(
        <CampaignDurationCell
            key={`campaign-duration-${id}-round-${round.number}`}
            colSpan={roundInterval}
            hasNextRound={Boolean(
                nextRound && nextRound.started_at && nextRound.ended_at,
            )}
            round={round}
        />,
    );
    return result;
};

const addRemainingEmptyCells = ({
    cells,
    dateUntilNextRound,
    lastSunday,
    nextRound,
    round,
    firstMonday,
    campaign,
    currentWeekIndex,
}) => {
    const { id } = campaign;
    const cellsData = getEmptyCellsData(dateUntilNextRound, lastSunday);
    let { extraDays } = cellsData;
    const { fullWeeks } = cellsData;
    if (
        !nextRound &&
        (isDateInRange(round.start, firstMonday, lastSunday) ||
            isDateInRange(round.end, firstMonday, lastSunday)) &&
        !campaign.isPreventive
    ) {
        extraDays += 1;
    }
    return getEmptyCells({
        cells,
        extraDays,
        fullWeeks,
        round,
        currentWeekIndex,
        id,
    });
};

const getCells = (campaign, currentWeekIndex, firstMonday, lastSunday) => {
    let cells = [];
    const { id, rounds } = campaign;
    rounds.forEach((round, index) => {
        // for one round
        const previousRound = rounds[index - 1];
        const nextRound = rounds[index + 1];
        const startInRange = isDateInRange(
            round.start,
            firstMonday,
            lastSunday,
        );
        const endInRange = isDateInRange(round.end, firstMonday, lastSunday);

        let dateUntilNextRound = round.end
            ?.clone()
            .add(round.daysCount, 'days');

        let dateUntilNextRoundInRange = isDateInRange(
            dateUntilNextRound,
            firstMonday,
            lastSunday,
        );

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
            rounds,
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
                    isRoundIntervalVisible,
                    isRoundVisible,
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
            if (index === rounds.length - 1 && dateUntilNextRoundInRange) {
                cells = addRemainingEmptyCells({
                    cells,
                    dateUntilNextRound,
                    lastSunday,
                    nextRound,
                    round,
                    firstMonday,
                    campaign,
                    currentWeekIndex,
                });
            }
        } else if (previousRound.end) {
            dateUntilNextRound = previousRound.end
                ?.clone()
                .add(previousRound.daysCount - 1, 'days');

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
                    isRoundIntervalVisible: true,
                    isRoundVisible,
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
                nextRound: null,
                round,
                firstMonday,
                campaign,
                currentWeekIndex,
            });
        }
    });
    return cells;
};

const getOrderArray = orders =>
    orders.split(',').map(stringValue => ({
        id: stringValue.replace('-', ''),
        desc: stringValue.indexOf('-') !== -1,
    }));

const getOrderValue = obj => (!obj.desc ? obj.id : `-${obj.id}`);

const getSort = sortList => {
    let orderTemp;
    sortList.forEach((sort, index) => {
        orderTemp = `${orderTemp || ''}${index > 0 ? ',' : ''}${getOrderValue(
            sort,
        )}`;
    });
    return orderTemp;
};

export {
    getCalendarData,
    filterCampaigns,
    mapCampaigns,
    getCells,
    getOrderArray,
    getSort,
};
