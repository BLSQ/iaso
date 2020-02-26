/* eslint-disable no-param-reassign */
let MONTH_NAMES = [];

const MONTH_TO_QUARTER = {
    1: '1',
    2: '1',
    3: '1',
    4: '2',
    5: '2',
    6: '2',
    7: '3',
    8: '3',
    9: '3',
    10: '4',
    11: '4',
    12: '4',
};

const SIX_MONTHLY_TO_MONTHS = {
    1: [1, 2, 3, 4, 5, 6],
    2: [7, 8, 9, 10, 11, 12],
};

// const QUARTER_BY_SIX_MONTHLY = {
//   1: [1, 2],
//   2: [3, 4],
// };

const MONTH_NAMES_FR = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
];

const MONTH_NAMES_EN = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

let MONTH_NAMES_BY_QUARTER = {};

const MONTH_NUMBER_BY_QUARTER = {
    1: ['1', '2', '3'],
    2: ['4', '5', '6'],
    3: ['7', '8', '9'],
    4: ['10', '11', '12'],
};

let eduQuarterNames = {};

const YEARLY = 'yearly';
const MONTHLY = 'monthly';
const QUARTERLY = 'quarterly';
const SIX_MONTHLY = 'sixMonthly';
const FINANCIAL_JULY = 'financialJuly';
const QUARTERLY_FIRST_MONTHS = 'quarterlyFirstMonths';
const QUARTERLY_TWO_LAST_MONTHS = 'quarterlyTwoLastMonths';

const SUPPORTED_PERIOD_TYPES = [
    YEARLY,
    MONTHLY,
    QUARTERLY,
    SIX_MONTHLY,
    FINANCIAL_JULY,
    QUARTERLY_FIRST_MONTHS,
    QUARTERLY_TWO_LAST_MONTHS,
];

const FORMAT_FY_JULY_QUARTER = 'fyJulyQuarter';
const FORMAT_YEAR = 'year';
const FORMAT_QUARTER = 'quarter';
const FORMAT_MONTH = 'month';
const FORMAT_MONTH_YEAR = 'monthYear';
const FORMAT_SIX_MONTH = 'sixMonth';
const FORMAT_EDU_QUARTER = 'eduQuarter';
const FORMAT_QUARTER_FIRST_MONTHS = 'firstMonths';
const FORMAT_QUARTER_TWO_LAST_MONTHS = 'twoLastMonths';

const SUPPORTED_FORMATS = [
    FORMAT_FY_JULY_QUARTER,
    FORMAT_YEAR,
    FORMAT_QUARTER,
    FORMAT_MONTH,
    FORMAT_MONTH_YEAR,
    FORMAT_SIX_MONTH,
    FORMAT_EDU_QUARTER,
    FORMAT_QUARTER_FIRST_MONTHS,
    FORMAT_QUARTER_TWO_LAST_MONTHS,
];

class DatePeriods {
    static setLocale(local) {
        const translations = local === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;
        this.setMonthTranslations(translations);
    }

    static setMonthTranslations(translations) {
        MONTH_NAMES = translations;
        MONTH_NAMES_BY_QUARTER = {
            1: [MONTH_NAMES[0], MONTH_NAMES[1], MONTH_NAMES[2]],
            2: [MONTH_NAMES[3], MONTH_NAMES[4], MONTH_NAMES[5]],
            3: [MONTH_NAMES[6], MONTH_NAMES[7], MONTH_NAMES[8]],
            4: [MONTH_NAMES[9], MONTH_NAMES[10], MONTH_NAMES[11]],
        };
        eduQuarterNames = {
            4: `T1 - ${MONTH_NAMES[8]} - ${MONTH_NAMES[11]}`,
            1: `T2 - ${MONTH_NAMES[0]} - ${MONTH_NAMES[2]}`,
            2: `T3 - ${MONTH_NAMES[3]} - ${MONTH_NAMES[5]}`,
            3: `XX - ${MONTH_NAMES[6]} - ${MONTH_NAMES[7]}`,
        };
    }

    static padMonth(n) {
        return n < 10 ? `0${n}` : n;
    }

    static month2quarter(month) {
        return MONTH_TO_QUARTER[month];
    }

    static dhis2MonthPeriod(year, month) {
        return `${year}${this.padMonth(month)}`;
    }

    static dhis2QuarterPeriod(year, month) {
        return `${year}Q${this.month2quarter(month)}`;
    }

    static dhis2QuarterPeriodShort(month) {
        return this.month2quarter(month);
    }

    static monthsInQuarter(quarterIntOrString) {
        const quarter = `${quarterIntOrString}`;
        const months = MONTH_NUMBER_BY_QUARTER[quarter];
        if (months === undefined) {
            throw new Error(`Doesn't appear to be a quarter${quarter}`);
        }
        return months;
    }

    static monthsNamesInQuarter(quarterIntOrString) {
        const quarter = `${quarterIntOrString}`;
        let months = [];

        months = MONTH_NAMES_BY_QUARTER[quarter];
        if (months === undefined) {
            throw new Error(`Doesn't appear to be a quarter${quarter}`);
        }
        return months;
    }

    static currentQuarter() {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - 2);
        return `${currentDate.getFullYear()}Q${this.quarterByMonth(
            currentDate.getMonth() + 1,
        )}`;
    }

    static monthName(period) {
        const yeaMonths = this.split(period, MONTHLY);
        const yearMonth = yeaMonths[yeaMonths.length - 1];
        const month = yearMonth.slice(4);
        const monthNumber = parseInt(month, 0);
        return MONTH_NAMES[monthNumber - 1];
    }

    static monthNameYear(period) {
        const yeaMonths = this.split(period, MONTHLY);
        const yearMonth = yeaMonths[yeaMonths.length - 1];
        const year = yearMonth.slice(0, 4);
        const month = yearMonth.slice(4);
        const monthNumber = parseInt(month, 0);
        return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
    }

    static sixMonthlyName(dhis2period) {
        const yearPeriod = this.split(dhis2period, 'yearly')[0];
        const months = this.split(dhis2period, 'monthly');
        return this.monthlyNameFormat(months, yearPeriod);
    }

    static monthlyNameFormat(months, yearPeriod) {
        return `${[months[0], months[months.length - 1]]
            .map(monthPeriod => this.monthName(monthPeriod))
            .join(' - ')} ${yearPeriod}`;
    }

    static displayName(dhis2period, format) {
        if (format === FORMAT_FY_JULY_QUARTER) {
            return this.period2FinancialYearJulyQuarterName(dhis2period);
        }
        if (format === FORMAT_YEAR) {
            return this.split(dhis2period, YEARLY)[0];
        }
        if (format === FORMAT_QUARTER) {
            return this.period2QuarterName(dhis2period);
        }
        if (format === FORMAT_MONTH) {
            return this.monthName(dhis2period);
        }
        if (
            format === FORMAT_MONTH_YEAR
      || format === FORMAT_QUARTER_FIRST_MONTHS
      || format === FORMAT_QUARTER_TWO_LAST_MONTHS
        ) {
            return this.monthNameYear(dhis2period);
        }
        if (format === FORMAT_SIX_MONTH) {
            return this.sixMonthlyName(dhis2period);
        }
        if (format === FORMAT_EDU_QUARTER) {
            return this.eduQuarterName(dhis2period);
        }
        throw new Error(
            `unsupported format '${format}' see ${SUPPORTED_FORMATS.join(',')}`,
        );
    }

    static eduQuarterName(period) {
        let year = parseInt(period.slice(0, 4), 0);
        const quarter = parseInt(period.slice(5, 6), 0);
        if (quarter >= 1 && quarter < 4) {
            year -= 1;
        }
        const formatted = `${year}-${year + 1} ${eduQuarterNames[quarter]}`;
        return formatted;
    }

    static period2QuarterName(dhis2period) {
        const yearPeriod = this.split(dhis2period, YEARLY)[0];
        const quarterPeriod = this.split(dhis2period, QUARTERLY)[0];
        const monthsPeriod = this.split(quarterPeriod, MONTHLY);
        return this.monthlyNameFormat(monthsPeriod, yearPeriod);
    }

    static period2FinancialYearJulyQuarterName(dhis2period) {
        return `${this.financialJulyQuarterName(
            dhis2period,
        )} (${this.period2QuarterName(dhis2period)})`;
    }

    static financialJulyQuarterName(dhis2period) {
        const yearPeriod = this.split(dhis2period, YEARLY)[0];
        const quarterPeriod = this.split(dhis2period, QUARTERLY)[0];

        let year = parseInt(yearPeriod, 0);
        let quarter = parseInt(quarterPeriod.slice(5), 0);

        if (quarter <= 2) {
            year -= 1;
            quarter += 2;
        } else {
            quarter -= 2;
        }
        return `FY ${year}/${year + 1} Quarter ${quarter}`;
    }

    static formatValues(dhis2period) {
        const quarterPeriod = this.split(dhis2period, QUARTERLY)[0];
        const monthDhis2Periods = this.split(quarterPeriod, MONTHLY);
        const monthPeriod = this.detect(dhis2period) === MONTHLY ? dhis2period : monthDhis2Periods[0];
        const yearPeriod = this.split(dhis2period, YEARLY)[0];

        const year = parseInt(yearPeriod, 0);
        const quarterNumber = parseInt(quarterPeriod.slice(5), 0);
        const monthNumber = parseInt(monthPeriod.slice(4), 0);
        let financialJulyYear = year;
        let financialQuarterNumber;
        if (quarterNumber <= 2) {
            financialJulyYear = year - 1;
            financialQuarterNumber = quarterNumber + 2;
        } else {
            financialQuarterNumber = quarterNumber - 2;
        }
        const financialJulyYearPlus1 = financialJulyYear + 1;

        const subs = {
            dhis2period,
            financialJulyYear,
            financialJulyYearPlus1,
            year,
            quarterNumber,
            financialQuarterNumber,
            monthNumber,
            monthName: this.monthName(monthPeriod),
            monthQuarterStart: monthDhis2Periods[0]
                ? this.monthName(monthDhis2Periods[0])
                : '',
            monthQuarterEnd: monthDhis2Periods[2]
                ? this.monthName(monthDhis2Periods[2])
                : '',
        };

        return subs;
    }

    static format(dhis2period, template) {
        return this.substituteStr(template, this.formatValues(dhis2period));
    }

    static substituteStr(str, data) {
        const output = str.replace(/(\${([^}]+)})/g, (match) => {
            const key = match.replace(/\${/, '').replace(/}/, '');
            if (data[key] !== undefined) {
                return data[key];
            }
            throw new Error(
                `unknown placeholder :'${key}' only knows ${JSON.stringify(data)}`,
            );
        });
        return output;
    }

    static next(period) {
        if (period.includes('Q')) {
            return this.nextQuarter(period);
        }
        if (period.includes('S')) {
            return this.nextSixMonth(period);
        }
        if (period.length === 6) {
            return this.nextYearMonth(period);
        }
        if (period.length === 4) {
            return this.nextYear(period);
        }
        if (period.includes('July')) {
            return this.nextFinancialJuly(period);
        }

        throw new Error(`unsupported period format${period}`);
    }

    static previous(period) {
        if (period.includes('Q')) {
            return this.previousQuarter(period);
        }
        if (period.includes('S')) {
            return this.previousSixMonth(period);
        }
        if (period.length === 6) {
            return this.previousYearMonth(period);
        }
        if (period.length === 4) {
            return this.previousYear(period);
        }
        if (period.includes('July')) {
            return this.previousFinancialJuly(period);
        }

        throw new Error(`unsupported period format${period}`);
    }

    static detect(dhis2Period) {
        if (dhis2Period.includes('Q')) {
            return QUARTERLY;
        }
        if (dhis2Period.includes('S')) {
            return SIX_MONTHLY;
        }
        if (dhis2Period.length === 6) {
            return MONTHLY;
        }
        if (dhis2Period.length === 4) {
            return YEARLY;
        }
        if (dhis2Period.includes('July')) {
            return FINANCIAL_JULY;
        }
        throw new Error(`unsupported period format${dhis2Period}`);
    }

    static nextYearMonth(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let month = parseInt(period.slice(4, 6), 0);
        if (month === 12) {
            year += 1;
            month = 1;
        } else {
            month += 1;
        }
        return `${year}${this.padMonth(month)}`;
    }

    static previousYearMonth(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let month = parseInt(period.slice(4, 6), 0);
        if (month === 1) {
            year -= 1;
            month = 12;
        } else {
            month -= 1;
        }
        return `${year}${this.padMonth(month)}`;
    }

    static nextYear(period) {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year + 1}`;
    }

    static previousYear(period) {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year - 1}`;
    }

    static nextFinancialJuly(period) {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year + 1}July`;
    }

    static previousFinancialJuly(period) {
        const year = parseInt(period.slice(0, 4), 0);
        return `${year - 1}July`;
    }

    static nextQuarter(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(5, 6), 0);
        if (quarter === 4) {
            year += 1;
            quarter = 1;
        } else if (quarter < 4) {
            quarter += 1;
        }
        return `${year}Q${quarter}`;
    }

    static nextSixMonth(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let sixMonth = parseInt(period.slice(5, 6), 0);
        if (sixMonth === 2) {
            year += 1;
            sixMonth = 1;
        } else if (sixMonth < 2) {
            sixMonth += 1;
        }
        return `${year}S${sixMonth}`;
    }

    static previousQuarter(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let quarter = parseInt(period.slice(5, 6), 0);
        if (quarter === 1) {
            year -= 1;
            quarter = 4;
        } else if (quarter > 1) {
            quarter -= 1;
        }
        return `${year}Q${quarter}`;
    }

    static previousSixMonth(period) {
        let year = parseInt(period.slice(0, 4), 0);
        let sixMonth = parseInt(period.slice(5, 6), 0);
        if (sixMonth === 1) {
            year -= 1;
            sixMonth = 2;
        } else if (sixMonth > 1) {
            sixMonth -= 1;
        }
        return `${year}S${sixMonth}`;
    }

    static quarterByMonth(month) {
        let quarter = 0;
        if (month >= 1 && month <= 3) {
            quarter = 1;
        }
        if (month >= 4 && month <= 6) {
            quarter = 2;
        }
        if (month >= 7 && month <= 9) {
            quarter = 3;
        }
        if (month >= 10 && month <= 12) {
            quarter = 4;
        }
        return quarter;
    }

    static split(period, splitType) {
        if (period === undefined) {
            throw new Error(`Can't split undefined period into ${splitType}`);
        }
        if (period.includes('Q')) {
            if (splitType === 'quarterlyFirstMonths') {
                return this.splitQuarterFirstMonths(period, splitType);
            }
            if (splitType === 'quarterlyTwoLastMonths') {
                return this.splitQuarterlyTwoLastMonths(period, splitType);
            }
            return this.splitYearQuarter(period, splitType);
        }
        if (period.includes('S')) {
            return this.splitYearSixMonth(period, splitType);
        }
        if (period.includes('July')) {
            return this.splitFinancialJuly(period, splitType);
        }
        if (period.length === 6) {
            return this.splitYearMonth(period, splitType);
        }
        if (period.length === 4) {
            return this.splitYear(period, splitType);
        }
        throw new Error(
            `don't know how to split ${period} as '${splitType}' length${period.length}`,
        );
    }

    static splitFinancialJuly(period, splitType) {
        const year = parseInt(period.slice(0, 4), 0);
        if (splitType === MONTHLY) {
            return [
                ['07', 0],
                ['08', 0],
                ['09', 0],
                ['10', 0],
                ['11', 0],
                ['12', 0],
                ['01', 1],
                ['02', 1],
                ['03', 1],
                ['04', 1],
                ['05', 1],
                ['06', 1],
            ].map(
                monthYearOffset => `${year + monthYearOffset[1]}${monthYearOffset[0]}`,
            );
        }

        if (splitType === QUARTERLY) {
            return [
                ['Q3', 0],
                ['Q4', 0],
                ['Q1', 1],
                ['Q2', 1],
            ].map(
                quarterYearOffset => `${year + quarterYearOffset[1]}${quarterYearOffset[0]}`,
            );
        }

        if (splitType === YEARLY) {
            return [`${year}`, `${year + 1}`];
        }

        if (splitType === SIX_MONTHLY) {
            return [`${year}S2`, `${year + 1}S1`];
        }

        this.unsupportedSplitType(period, splitType);
        return null;
    }

    static splitYear(period, splitType) {
        const year = parseInt(period.slice(0, 4), 0);
        if (splitType === MONTHLY) {
            return [
                '01',
                '02',
                '03',
                '04',
                '05',
                '06',
                '07',
                '08',
                '09',
                '10',
                '11',
                '12',
            ].map(month => `${year}${month}`);
        }

        if (splitType === SIX_MONTHLY) {
            return [`${year}S1`, `${year}S2`];
        }
        if (splitType === QUARTERLY) {
            return ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => `${year}${quarter}`);
        }
        if (splitType === YEARLY) {
            return [`${year}`];
        }
        if (splitType === FINANCIAL_JULY) {
            return [`${year - 1}July`, `${year}July`];
        }
        this.unsupportedSplitType(period, splitType);
        return null;
    }

    static splitQuarterFirstMonths(period) {
        const year = parseInt(period.slice(0, 4), 0);
        const quarter = parseInt(period.slice(5, 6), 0);
        const months = this.monthsInQuarter(quarter);
        return [this.dhis2MonthPeriod(year, months[0])];
    }

    static splitQuarterlyTwoLastMonths(period) {
        const year = parseInt(period.slice(0, 4), 0);
        const quarter = parseInt(period.slice(5, 6), 0);
        const months = this.monthsInQuarter(quarter);
        return [
            this.dhis2MonthPeriod(year, months[1]),
            this.dhis2MonthPeriod(year, months[2]),
        ];
    }

    static splitYearQuarter(period, splitType) {
        const year = parseInt(period.slice(0, 4), 0);
        const quarter = parseInt(period.slice(5, 6), 0);
        if (splitType === MONTHLY) {
            return this.monthsInQuarter(quarter).map(month => this.dhis2MonthPeriod(year, month));
        }

        if (splitType === SIX_MONTHLY) {
            return [quarter < 3 ? `${year}S1` : `${year}S2`];
        }

        if (splitType === QUARTERLY) {
            return [period];
        }
        if (splitType === YEARLY) {
            return [`${year}`];
        }
        if (splitType === FINANCIAL_JULY) {
            return quarter < 3 ? [`${year - 1}July`] : [`${year}July`];
        }
        this.unsupportedSplitType(period, splitType);
        return null;
    }

    static splitYearSixMonth(period, splitType) {
        const year = parseInt(period.slice(0, 4), 0);
        const semester = parseInt(period.slice(5, 6), 0);
        if (splitType === MONTHLY) {
            return SIX_MONTHLY_TO_MONTHS[semester].map(month => this.dhis2MonthPeriod(year, month));
        }
        if (splitType === SIX_MONTHLY) {
            return [period];
        }
        if (splitType === QUARTERLY) {
            if (semester === 1) {
                return [`${year}Q1`, `${year}Q2`];
            }
            return [`${year}Q3`, `${year}Q4`];
        }
        if (splitType === YEARLY) {
            return [`${year}`];
        }
        if (splitType === FINANCIAL_JULY) {
            return semester === 1 ? [`${year - 1}July`] : [`${year}July`];
        }
        this.unsupportedSplitType(period, splitType);
        return null;
    }

    static splitYearMonth(period, splitType) {
        const year = parseInt(period.slice(0, 4), 0);
        const month = parseInt(period.slice(4, 6), 0);
        if (splitType === MONTHLY) {
            return [period];
        }
        if (splitType === QUARTERLY) {
            const quarter = this.month2quarter(month);
            return [`${year}Q${quarter}`];
        }
        if (splitType === SIX_MONTHLY) {
            if (month < 7) {
                return [`${year}S1`];
            }
            return [`${year}S2`];
        }
        if (splitType === YEARLY) {
            return [`${year}`];
        }
        if (splitType === FINANCIAL_JULY) {
            return month < 7 ? [`${year - 1}July`] : [`${year}July`];
        }
        this.unsupportedSplitType(period, splitType);
        return null;
    }

    static monthlyPeriods(year, quarter) {
        return this.monthsInQuarter(quarter).map(month => this.dhis2MonthPeriod(year, month));
    }

    static unsupportedSplitType(period, splitType) {
        throw new Error(
            `Don't know how to split : ${period}, unknown splitType ${splitType} only knows ${SUPPORTED_PERIOD_TYPES.join(
                ', ',
            )}`,
        );
    }

    static previousPeriods(period, numberOfPeriods) {
        let previous = '';
        const previousPeriods = [];

        for (let i = 0; i < numberOfPeriods; i += 1) {
            if (i > 0) {
                period = previousPeriods[i - 1];
            }
            previous = this.previous(period);
            previousPeriods.push(previous);
        }
        return previousPeriods.reverse();
    }

    static nextPeriods(period, numberOfPeriods) {
        let next = '';
        const nextPeriods = [];

        for (let i = 0; i < numberOfPeriods; i += 1) {
            if (i > 0) {
                period = nextPeriods[i - 1];
            }
            next = this.next(period);
            nextPeriods.push(next);
        }
        return nextPeriods;
    }
}

export default DatePeriods;
