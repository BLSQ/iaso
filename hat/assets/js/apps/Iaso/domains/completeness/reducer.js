import _ from 'lodash';

import {
    SET_COMPLETENESS,
    START_FETCHING_COMPLETENESS,
    STOP_FETCHING_COMPLETENESS,
} from './actions';
import Period, { PERIOD_TYPE_QUARTERLY } from './periods';


export const completenessInitialState = {
    fetching: false,
    data: [],
};

function groupCompletenessData(completenessData, periodType = PERIOD_TYPE_QUARTERLY) {
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

export const reducer = (state = completenessInitialState, action = {}) => {
    switch (action.type) {
        case SET_COMPLETENESS:
            const rawCompletenessData = action.payload;
            const groupedCompletenessData = groupCompletenessData(rawCompletenessData);
            return { ...state, data: groupedCompletenessData };
        case START_FETCHING_COMPLETENESS:
            return { ...state, fetching: true };
        case STOP_FETCHING_COMPLETENESS:
            return { ...state, fetching: false };
        default:
            return state;
    }
};
