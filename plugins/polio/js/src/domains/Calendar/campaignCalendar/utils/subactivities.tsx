import React, { ReactElement } from 'react';
import { Moment } from 'moment';

import { SubactivityCell } from '../cells/SubactivityCell';
import { MappedCampaign, SubActivity } from '../types';
import {
    addRemainingEmptyCells,
    getEmptyCellBetweenTwoDates,
    drawEmptyFirstCells,
    isDateInRange,
} from './index';

const addSubactivityCell = ({
    cells,
    subActivity,
    firstMonday,
    lastSunday,
    startInRange,
    endInRange,
}: {
    cells: ReactElement[];
    subActivity: SubActivity;
    firstMonday: Moment;
    lastSunday: Moment;
    startInRange: boolean;
    endInRange: boolean;
}) => {
    let colSpan = 1;
    const result = [...cells];

    const startAndEndInRange = startInRange && endInRange;

    const onlyStartInRange = !endInRange && startInRange;

    const onlyEndInRange = !startInRange && endInRange;

    if (subActivity.start_date && subActivity.end_date) {
        if (startAndEndInRange) {
            // if both start and end date are in range use diff between dates for length of cells
            colSpan = subActivity.end_date
                .clone()
                .add(1, 'day')
                .diff(subActivity.start_date, 'days');
            // else if start is not in range calculate diff with firstmonday
        } else if (onlyEndInRange) {
            colSpan = subActivity.end_date
                .clone()
                .add(1, 'day')
                .diff(firstMonday, 'days');
            // else if end is not in range calculate diff with lastSunday
        } else if (onlyStartInRange) {
            colSpan = Math.abs(
                subActivity.start_date
                    .clone()
                    .subtract(1, 'day')
                    .diff(lastSunday, 'days'),
            );
        }
    }
    result.push(
        <SubactivityCell
            key={`subactivity-${subActivity.id}`}
            colSpan={colSpan}
        />,
    );
    return result;
};

const getSubActivitiesRow = (
    originalCells: ReactElement[],
    subActivities: SubActivity[],
    firstMonday: Moment,
    lastSunday: Moment,
    currentWeekIndex: number,
    campaign: MappedCampaign,
): ReactElement[] => {
    // First order subActivities by start date and filter out subActivities that are not in range
    let cells = [...originalCells];
    if (subActivities.length > 0) {
        // Draw cells before first subActivity
        const firstSubActivity = subActivities[0];
        const emptyCells = drawEmptyFirstCells({
            startDate: firstSubActivity.start_date.clone(),
            firstMonday,
            currentWeekIndex,
            id: campaign.id,
        });
        cells.push(...emptyCells);
        // loop into subActivities
        subActivities.forEach((subActivity, index) => {
            const startInRange = subActivity.start_date
                ? isDateInRange(subActivity.start_date, firstMonday, lastSunday)
                : false;
            const endInRange = subActivity.end_date
                ? isDateInRange(subActivity.end_date, firstMonday, lastSunday)
                : false;
            // Draw subactivity
            cells = addSubactivityCell({
                cells,
                subActivity,
                firstMonday,
                lastSunday,
                startInRange,
                endInRange,
            });
            // Draw cells after subActivity
            const nextSubActivity = subActivities[index + 1];
            if (nextSubActivity) {
                const nextStartDate = nextSubActivity?.start_date.clone();
                const emptyBetweenCells = getEmptyCellBetweenTwoDates(
                    subActivity.end_date,
                    nextStartDate,
                    cells,
                    currentWeekIndex,
                );
                cells.push(...emptyBetweenCells);
            }
        });

        // Draw cells after last subActivity
        cells = addRemainingEmptyCells({
            cells,
            dateUntilNextRound:
                subActivities[subActivities.length - 1].end_date,
            lastSunday,
            campaign,
            currentWeekIndex,
        });
    }

    return cells;
};

export const getSubActivitiesCells = (
    campaign: MappedCampaign,
    currentWeekIndex: number,
    firstMonday: Moment,
    lastSunday: Moment,
): ReactElement[] => {
    let cells: ReactElement[] = [];

    cells = getSubActivitiesRow(
        cells,
        campaign.subActivities,
        firstMonday,
        lastSunday,
        currentWeekIndex,
        campaign,
    );
    return cells;
};
