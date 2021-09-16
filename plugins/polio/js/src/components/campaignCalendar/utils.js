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
    };
};

const filterCampaigns = (allCampaigns, currentMonday, weeks) => {
    const firstMonday = currentMonday.clone().subtract(3, 'week');
    const lastSunday = currentMonday
        .clone()
        .add(colsCount - 4, 'week')
        .endOf('isoWeek');
    console.log('firstMonday', firstMonday.format('LTS'));
    console.log('lastSunday', lastSunday.format('LTS'));
    return allCampaigns
        .filter(
            campaign =>
                campaign.round_one?.ended_at &&
                campaign.round_one?.started_at &&
                ((moment(
                    campaign.round_one.started_at,
                    dateFormat,
                ).isSameOrAfter(firstMonday) &&
                    moment(
                        campaign.round_one.started_at,
                        dateFormat,
                    ).isSameOrBefore(lastSunday)) ||
                    (moment(
                        campaign.round_two.ended_at,
                        dateFormat,
                    ).isSameOrBefore(lastSunday) &&
                        moment(
                            campaign.round_two.ended_at,
                            dateFormat,
                        ).isSameOrAfter(firstMonday))),
        )
        .map(c => {
            const r1WeekIndex = [];
            const r2WeekIndex = [];
            let campaignWeeks = 0;
            // let campaignDisplayedWeeks = 0;
            const R1Start =
                c.round_one?.started_at &&
                moment(c.round_one.started_at, dateFormat);
            const R1End =
                c.round_one?.ended_at &&
                moment(c.round_one.ended_at, dateFormat);
            const R2Start =
                c.round_two?.started_at &&
                moment(c.round_two.started_at, dateFormat);
            const R2End =
                c.round_two?.ended_at &&
                moment(c.round_two.ended_at, dateFormat);
            // console.log('weeks', weeks);
            // console.log('R1Start', R1Start.format('LTS'));
            // console.log('R1End', R1End.format('LTS'));
            // console.log('R2Start', R2Start.format('LTS'));
            // console.log('R2End', R2End.format('LTS'));
            weeks.forEach((w, i) => {
                const { monday } = w;
                const sunday = monday.clone().endOf('isoWeek');
                // console.log('sunday', sunday.format('LTS'));
                // console.log('week', w);
                if (
                    (R1Start &&
                        R1Start.isAfter(monday) &&
                        R1Start.isBefore(sunday)) ||
                    (R1End && R1End.isBefore(sunday) && R1End.isAfter(monday))
                ) {
                    r1WeekIndex.push(i + 1);
                }
                if (
                    (R2Start &&
                        R2Start.isAfter(monday) &&
                        R2Start.isBefore(sunday)) ||
                    (R2End && R2End.isBefore(sunday) && R2End.isAfter(monday))
                ) {
                    // console.log('monday', monday.format('LTS'));
                    // console.log('sunday', sunday.format('LTS'));
                    r2WeekIndex.push(i);
                }
            });
            if (R2Start) {
                // if (R1End.isBefore(firstMonday)) {
                //     campaignDisplayedWeeks = R2Start.diff(
                //         firstMonday,
                //         'weeks',
                //     );
                // } else {
                //     campaignDisplayedWeeks = R2Start.diff(R1End, 'weeks');
                // }
                campaignWeeks = R2Start.diff(R1End, 'days');
            } else if (R1End) {
                campaignWeeks = 6;
            }
            // console.log('r1WeekIndex', r1WeekIndex);
            // console.log('r2WeekIndex', r2WeekIndex);
            return {
                id: c.id,
                name: c.obr_name,
                r1WeekIndex,
                campaignWeeks,
                // campaignDisplayedWeeks,
                r2WeekIndex,
                orginal: c,
            };
        });
};

export { getCalendarData, filterCampaigns };
