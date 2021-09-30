import moment from 'moment';
import React from 'react';
import { colsCount, dateFormat } from './constants';

import { R1Cell } from './cells/R1';
import { R2Cell } from './cells/R2';
import { CampaignDurationCell } from './cells/CampaignDuration';
import { EmptyCell } from './cells/Empty';

const getCalendarData = currentMonday => {
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
    const headers = {
        years: [],
        months: [],
        weeks: [],
    };
    let currentWeekIndex = -1;
    Array(colsCount)
        .fill()
        .forEach((_, i) => {
            const newMonday = firstMonday.clone().add(i, 'week');
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

const filterCampaigns = (allCampaigns, firstMonday, lastSunday) => {
    return allCampaigns.filter(campaign => {
        const { R1Start, R1End, R2End } = campaign;
        return (
            R1End &&
            R1Start &&
            ((R1Start.isSameOrAfter(firstMonday) &&
                R1Start.isSameOrBefore(lastSunday)) ||
                (R2End &&
                    R2End.isSameOrBefore(lastSunday) &&
                    R2End.isSameOrAfter(firstMonday)) ||
                (!R2End &&
                    R1End.clone().add(6, 'weeks').isSameOrBefore(lastSunday) &&
                    R1End.clone().add(6, 'weeks').isSameOrAfter(firstMonday)))
        );
    });
};

const mapCampaigns = allCampaigns => {
    return allCampaigns.map((c, index) => {
        const R1Start =
            c.round_one?.started_at &&
            moment(c.round_one.started_at, dateFormat);
        const R1End =
            c.round_one?.ended_at && moment(c.round_one.ended_at, dateFormat);
        const R2Start =
            c.round_two?.started_at &&
            moment(c.round_two.started_at, dateFormat);
        const R2End =
            c.round_two?.ended_at && moment(c.round_two.ended_at, dateFormat);
        const campaignWeeks = R2Start ? R2Start.diff(R1End, 'weeks') : 6;
        const campaignDays = R2Start ? R2Start.diff(R1End, 'days') : 6 * 7;

        return {
            id: c.id,
            name: c.obr_name,
            country: c.top_level_org_unit_name,
            country_id: c.top_level_org_unit_id,
            R1Start,
            R1End,
            R2Start,
            R2End,
            campaignWeeks,
            campaignDays,
            original: c,
        };
    });
};

const getCells = (campaign, currentWeekIndex, firstMonday, lastSunday) => {
    const cells = [];
    const { R1Start, R1End, R2Start, R2End, campaignDays, id } = campaign;
    let colSpan;
    if (R1Start && R1End) {
        const availableDays = lastSunday.diff(R1End, 'days');
        const availableCampaignDays =
            campaignDays - 1 > availableDays ? availableDays : campaignDays - 1;
        if (
            R1Start.isSameOrAfter(firstMonday, 'day') &&
            R1Start.isSameOrBefore(lastSunday, 'day')
        ) {
            if (!R1Start.isSame(firstMonday, 'day')) {
                let monday;
                if (R1Start.weekday() !== 1) {
                    monday = R1Start.clone().startOf('isoWeek');
                } else {
                    monday = R1Start.clone();
                }
                const extraDays = R1Start.clone().diff(monday, 'days');
                const fullWeeks = monday.diff(firstMonday, 'weeks');

                Array(fullWeeks)
                    .fill()
                    .forEach((_, i) => {
                        cells.push(
                            <EmptyCell
                                key={`empty-cell-${id}-start-${i}`}
                                colSpan={7}
                                isCurrentWeek={
                                    cells.length + 1 === currentWeekIndex
                                }
                            />,
                        );
                    });
                if (extraDays) {
                    cells.push(
                        <EmptyCell
                            key={`empty-cell-${id}-start-${R1Start}`}
                            colSpan={extraDays}
                            isCurrentWeek={
                                cells.length + 1 === currentWeekIndex
                            }
                        />,
                    );
                }
            }

            colSpan = R1End.clone().add(1, 'day').diff(R1Start, 'days');
            cells.push(
                <R1Cell
                    key={`r1-campaign-${id}`}
                    colSpan={colSpan}
                    campaign={campaign}
                />,
            );
            if (!R1End.isAfter(lastSunday)) {
                cells.push(
                    <CampaignDurationCell
                        key={`campaign-duration-${id}`}
                        colSpan={availableCampaignDays}
                        hasR2={Boolean(R2Start)}
                        campaign={campaign}
                    />,
                );
            }
        } else if (
            R1End.isSameOrAfter(firstMonday, 'day') &&
            R1End.isSameOrBefore(lastSunday, 'day')
        ) {
            colSpan = R1End.clone().add(1, 'day').diff(firstMonday, 'days');
            cells.push(
                <R1Cell
                    key={`r1-campaign-${id}`}
                    colSpan={colSpan}
                    campaign={campaign}
                />,
            );
            cells.push(
                <CampaignDurationCell
                    key={`campaign-duration-${id}`}
                    colSpan={availableCampaignDays}
                    hasR2={Boolean(R2Start)}
                    campaign={campaign}
                />,
            );
        } else if (
            R1End.isBefore(firstMonday, 'day') &&
            firstMonday.diff(R1End, 'days') < campaignDays
        ) {
            colSpan = campaignDays - firstMonday.diff(R1End, 'days');
            cells.push(
                <CampaignDurationCell
                    key={`campaign-duration-${id}`}
                    colSpan={colSpan}
                    hasR2={Boolean(R2Start)}
                    campaign={campaign}
                />,
            );
        }

        if (R2Start && R2End) {
            if (
                R2Start.isSameOrAfter(firstMonday, 'day') &&
                R2Start.isSameOrBefore(lastSunday, 'day')
            ) {
                colSpan = R2End.clone().add(1, 'day').diff(R2Start, 'days');
                cells.push(
                    <R2Cell
                        key={`round2Cost-campaign-${id}`}
                        colSpan={colSpan}
                        campaign={campaign}
                    />,
                );
            } else if (
                R2End.isSameOrAfter(firstMonday, 'day') &&
                R2End.isSameOrBefore(lastSunday, 'day')
            ) {
                colSpan = R2End.clone().add(1, 'day').diff(firstMonday, 'days');
                cells.push(
                    <R2Cell
                        key={`round2Cost-campaign-${id}`}
                        colSpan={colSpan}
                        campaign={campaign}
                    />,
                );
            }

            if (
                R2End.isSameOrAfter(firstMonday, 'day') &&
                R2End.isSameOrBefore(lastSunday, 'day')
            ) {
                let sunday;
                if (R2End.weekday() !== 7) {
                    sunday = R2End.clone().endOf('isoWeek');
                } else {
                    sunday = R2End.clone();
                }
                const extraDays = sunday.diff(R2End, 'days');
                const fullWeeks = lastSunday.diff(sunday, 'weeks');

                let spans = 0;
                cells.forEach(c => {
                    spans += c.props.colSpan;
                });
                spans = parseInt(spans / 7, 10);
                if (extraDays) {
                    spans += 1;
                    cells.push(
                        <EmptyCell
                            key={`empty-cell-${id}-start-${R2End}`}
                            colSpan={extraDays}
                            isCurrentWeek={spans === currentWeekIndex}
                        />,
                    );
                }
                Array(fullWeeks)
                    .fill()
                    .forEach((_, i) => {
                        spans += 1;
                        cells.push(
                            <EmptyCell
                                key={`empty-cell-${id}-end-${i}`}
                                colSpan={7}
                                isCurrentWeek={spans === currentWeekIndex}
                            />,
                        );
                    });
            }
        }
        if (!R2Start && cells.length > 0) {
            let sunday;
            const fakeR2End = R1End.clone().add(campaignDays, 'days');
            if (!fakeR2End.isAfter(lastSunday)) {
                if (fakeR2End.weekday() !== 7) {
                    sunday = fakeR2End.clone().endOf('isoWeek');
                } else {
                    sunday = fakeR2End.clone();
                }
                const extraDays = sunday
                    .clone()
                    .add(1, 'day')
                    .diff(fakeR2End, 'days');
                const fullWeeks = lastSunday.diff(sunday, 'weeks');

                let spans = 0;
                cells.forEach(c => {
                    spans += c.props.colSpan;
                });
                spans = parseInt(spans / 7, 10);
                if (extraDays) {
                    spans += 1;
                    cells.push(
                        <EmptyCell
                            key={`empty-cell-${id}-end-${R2End}`}
                            colSpan={extraDays}
                            isCurrentWeek={spans === currentWeekIndex}
                        />,
                    );
                }
                Array(fullWeeks)
                    .fill()
                    .forEach((_, i) => {
                        spans += 1;
                        cells.push(
                            <EmptyCell
                                key={`empty-cell-${id}-end-${i}`}
                                colSpan={7}
                                isCurrentWeek={spans === currentWeekIndex}
                            />,
                        );
                    });
            }
        }
    }
    if (cells.length === 0) {
        Array(colsCount)
            .fill()
            .forEach((_, i) => {
                cells.push(
                    <EmptyCell
                        key={`empty-cell-${id}-${i}`}
                        colSpan={7}
                        isCurrentWeek={i + 1 === currentWeekIndex}
                    />,
                );
            });
    }
    return cells;
};

export { getCalendarData, filterCampaigns, mapCampaigns, getCells };
