import has from 'lodash/has';
import set from 'lodash/set';
import update from 'lodash/update';

import { Period } from '../periods/models';
import {
    PERIOD_TYPE_QUARTER,
} from '../periods/constants';


/**
 * This function takes a flat list of completeness data, as returned by the API, and transforms it into
 * a list of period groups containing form groups
 *
 * @param completenessData
 * @param periodType
 * @return {{}}
 */
export function groupCompletenessData(completenessData, periodType = PERIOD_TYPE_QUARTER) {
    const groupedCompletenessData = {};
    completenessData.forEach((dataEntry) => {
        const period = new Period(dataEntry.period);
        const groupPeriod = period.asPeriodType(periodType);

        // create period group if not exist
        const periodPath = groupPeriod.periodString;
        if (!has(groupedCompletenessData, periodPath)) {
            set(groupedCompletenessData, periodPath, {
                period: groupPeriod,
                forms: {},
            });
        }

        // create form group if not exist
        const formPath = `${periodPath}.forms.${dataEntry.form.id}`;
        if (!has(groupedCompletenessData, formPath)) {
            set(groupedCompletenessData, formPath, {
                ...dataEntry.form,
                months: Object.fromEntries(groupPeriod.monthRange.map(month => [month, {
                    ready: 0,
                    error: 0,
                    exported: 0,
                    period,
                }])),
            });
        }

        const monthPath = `${formPath}.months.${period.month}`;
        update(groupedCompletenessData, `${monthPath}.ready`, ready => ready + dataEntry.counts.ready);
        update(groupedCompletenessData, `${monthPath}.error`, error => error + dataEntry.counts.error);
        update(groupedCompletenessData, `${monthPath}.exported`, exported => exported + dataEntry.counts.exported);
        update(groupedCompletenessData, `${monthPath}.period`, p => period);
    });

    return Object
        .values(groupedCompletenessData)
        .map(periodData => ({
            ...periodData,
            forms: Object.values(periodData.forms),
        }))
        .sort((group1, group2) => (
            group1.period.periodString < group2.period.periodString ? -1 : 1
        ))
        .reverse();
}
