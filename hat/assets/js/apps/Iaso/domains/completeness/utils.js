import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';


import { Period } from '../periods/models';
import {
    PERIOD_TYPE_QUARTER, PERIOD_TYPE_MONTH, PERIOD_TYPE_YEAR, PERIOD_TYPE_SIX_MONTH,
} from '../periods/constants';
import { formatThousand } from '../../../../utils';


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
                months: Object.fromEntries(groupPeriod.monthRange.map(month => [month, {
                    ready: 0,
                    error: 0,
                    exported: 0,
                }])),
            });
        }

        const monthPath = `${formPath}.months.${period.month}`;
        _.update(groupedCompletenessData, `${monthPath}.ready`, ready => ready + dataEntry.counts.ready);
        _.update(groupedCompletenessData, `${monthPath}.error`, error => error + dataEntry.counts.error);
        _.update(groupedCompletenessData, `${monthPath}.exported`, exported => exported + dataEntry.counts.exported);
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
