import _ from 'lodash';
import Period, { PERIOD_TYPE_QUARTERLY } from './periods';

// eslint-disable-next-line import/prefer-default-export
export function groupCompletenessData(completenessData, periodType = PERIOD_TYPE_QUARTERLY) {
    const groupedCompletenessData = {};
    completenessData.forEach((dataEntry) => {
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
        if (!_.has(groupCompletenessData, formPath)) {
            _.set(groupedCompletenessData, formPath, {
                id: dataEntry.form.id,
                name: dataEntry.form.name,
                months: Object.fromEntries(groupPeriod.monthRange.map(month => [month, {
                    ready: 0,
                    error: 0,
                    exported: 0,
                }])),
            });
        }

        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.ready`, ready => ready + dataEntry.counts.ready);
        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.error`, error => error + dataEntry.counts.duplicated);
        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.exported`, exported => exported + dataEntry.counts.exported);
    });

    console.log(1, groupedCompletenessData);
    // console.log(2, Object.values(groupedCompletenessData));

    return groupedCompletenessData;
}
