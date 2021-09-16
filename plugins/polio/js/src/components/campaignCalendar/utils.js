import moment from 'moment';
import { colsCount, dateFormat } from './constants';

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
    return allCampaigns.filter(
        campaign =>
            campaign.R1End &&
            campaign.R1Start &&
            ((moment(campaign.R1Start, dateFormat).isSameOrAfter(firstMonday) &&
                moment(campaign.R1Start, dateFormat).isSameOrBefore(
                    lastSunday,
                )) ||
                (moment(campaign.R2End, dateFormat).isSameOrBefore(
                    lastSunday,
                ) &&
                    moment(campaign.R2End, dateFormat).isSameOrAfter(
                        firstMonday,
                    ))),
    );
};

const mapCampaigns = allCampaigns => {
    return allCampaigns.map(c => {
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
            R1Start,
            R1End,
            R2Start,
            R2End,
            campaignWeeks,
            campaignDays,
            orginal: c,
        };
    });
};
export { getCalendarData, filterCampaigns, mapCampaigns };
