import React, { ReactElement } from 'react';
import { Moment } from 'moment';

import { SubactivityCell } from '../cells/SubactivityCell';
import { MappedCampaign, SubActivity } from '../types';
import {
    addRemainingEmptyCells,
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
    campaign,
}: {
    cells: ReactElement[];
    subActivity: SubActivity;
    firstMonday: Moment;
    lastSunday: Moment;
    startInRange: boolean;
    endInRange: boolean;
    campaign: MappedCampaign;
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
            campaign={campaign}
            subactivity={subActivity}
        />,
    );
    return result;
};

export const getSubActivitiesRow = (
    subActivity: SubActivity,
    firstMonday: Moment,
    lastSunday: Moment,
    currentWeekIndex: number,
    campaign: MappedCampaign,
): ReactElement[] => {
    // First order subActivities by start date and filter out subActivities that are not in range
    let cells: ReactElement[] = [];
    // Draw cells before first subActivity
    if (firstMonday.isBefore(subActivity.start_date, 'day')) {
        const emptyCells = drawEmptyFirstCells({
            startDate: subActivity.start_date.clone(),
            firstMonday,
            currentWeekIndex,
            id: campaign.id,
        });
        cells.push(...emptyCells);
    }
    const startInRange = subActivity.start_date
        ? isDateInRange(subActivity.start_date.clone(), firstMonday, lastSunday)
        : false;
    const endInRange = subActivity.end_date
        ? isDateInRange(subActivity.end_date.clone(), firstMonday, lastSunday)
        : false;
    // Draw subactivity
    cells = addSubactivityCell({
        cells,
        subActivity,
        firstMonday,
        lastSunday,
        startInRange,
        endInRange,
        campaign,
    });

    // Draw cells after last subActivity
    cells = addRemainingEmptyCells({
        cells,
        dateUntilNextRound: subActivity.end_date.clone(),
        lastSunday,
        campaign,
        currentWeekIndex,
    });

    return cells;
};
