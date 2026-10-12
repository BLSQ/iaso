import { isEqual, pick } from 'lodash';
import moment from 'moment';
import { PlanningFormik } from './hooks/usePlanningForm';
import { PageMode, Planning } from './types';

export const canAssignPlanning = (planning?: Planning): boolean => {
    if (!planning) return false;
    const hasPipelines =
        Array.isArray(planning.pipeline_uuids) &&
        planning.pipeline_uuids.length > 0;
    const hasSampling = Boolean(planning.selected_sampling_result);
    if (!hasPipelines) return true;
    return hasSampling;
};

const SAVE_WARNING_FIELDS = [
    'startDate',
    'endDate',
    'publishingStatus',
    'project',
    'missions',
] as const;

const isActiveToday = (startDate?: string, endDate?: string): boolean =>
    Boolean(
        startDate &&
        endDate &&
        moment().isBetween(
            moment(startDate, 'L'),
            moment(endDate, 'L'),
            'day',
            '[]',
        ),
    );

// Editing these fields on a running, published planning can disrupt ongoing data collection.
export const shouldWarnBeforeSave = (
    { values, initialValues }: PlanningFormik,
    mode: PageMode,
): boolean => {
    if (
        mode !== 'edit' ||
        initialValues.publishingStatus !== 'published' ||
        !isActiveToday(initialValues.startDate, initialValues.endDate)
    ) {
        return false;
    }
    return !isEqual(
        pick(values, SAVE_WARNING_FIELDS),
        pick(initialValues, SAVE_WARNING_FIELDS),
    );
};
