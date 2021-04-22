import { Period } from './models';

export const getDefaultPeriodString = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = Period.padMonth(new Date().getMonth() + 1);
    return `${currentYear}${currentMonth}`;
};

export const getDefaultPeriod = () => new Period(getDefaultPeriodString());
