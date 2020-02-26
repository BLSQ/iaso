import orderBy from 'lodash/orderBy';
import DatePeriods from '../libs/DatePeriods';

const PeriodTypes = [
    'MONTH',
    'QUARTER',
    'SIX_MONTH',
    'YEAR',
];

export const getPrettyPeriod = (period) => {
    if (period.length === 4) {
        return period;
    }
    const year = period.substring(0, 4);
    const prefix = period.substring(4, 6);
    return `${prefix}-${year}`;
};

export const sortPeriods = (data) => {
    let sortedData = data.map(d => ({
        ...d,
        monthPeriod: DatePeriods.split(d.period, 'monthly')[0],
    }));
    sortedData = orderBy(
        sortedData,
        [period => period.monthPeriod],
        ['desc'],
    );
    return sortedData;
};

export const sortPeriodTypes = periodTypes => orderBy(
    periodTypes,
    [periodType => PeriodTypes.indexOf(periodType[0])],
    ['asc'],
);

export default getPrettyPeriod;
