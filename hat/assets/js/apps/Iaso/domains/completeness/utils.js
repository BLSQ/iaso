import _ from 'lodash';

import { Period } from '../periods/models';
import { PERIOD_TYPE_QUARTER } from '../periods/constants';

/**
 * This function takes a flat list of completeness data, as returned by the API, and transforms it into
 * a list of period groups containing form groups
 *
 * @param completenessData
 * @param periodType
 * @return {{}}
 */
export function groupCompletenessData(
    completenessData,
    periodType = PERIOD_TYPE_QUARTER,
) {
    const groupedCompletenessData = {};
    completenessData.forEach(dataEntry => {
        const period = new Period(dataEntry.period);
        const groupPeriod = period.asPeriodType(periodType);

        // create period group if not exist
        const periodPath = groupPeriod.periodString;
        if (!_.has(groupedCompletenessData, periodPath)) {
            _.set(groupedCompletenessData, periodPath, {
                period: groupPeriod,
                forms: {},
            });
        }

        // create form group if not exist
        const formPath = `${periodPath}.forms.${dataEntry.form.id}`;
        if (!_.has(groupedCompletenessData, formPath)) {
            _.set(groupedCompletenessData, formPath, {
                ...dataEntry.form,
                months: Object.fromEntries(
                    groupPeriod.monthRange.map(month => [
                        month,
                        {
                            ready: 0,
                            error: 0,
                            exported: 0,
                            period,
                            form: dataEntry.form,
                        },
                    ]),
                ),
            });
        }

        const monthPath = `${formPath}.months.${period.month}`;
        _.update(
            groupedCompletenessData,
            `${monthPath}.ready`,
            ready => ready + dataEntry.counts.ready,
        );
        _.update(
            groupedCompletenessData,
            `${monthPath}.error`,
            error => error + dataEntry.counts.error,
        );
        _.update(
            groupedCompletenessData,
            `${monthPath}.exported`,
            exported => exported + dataEntry.counts.exported,
        );
        _.update(groupedCompletenessData, `${monthPath}.period`, () => period);
    });

    const data = Object.values(groupedCompletenessData)
        .map(periodData => ({
            ...periodData,
            forms: Object.values(periodData.forms).sort((f1, f2) =>
                f1.name < f2.name ? -1 : 1,
            ),
        }))
        .sort((group1, group2) =>
            group1.period.periodString < group2.period.periodString ? -1 : 1,
        )
        .reverse();
    return data;
}
