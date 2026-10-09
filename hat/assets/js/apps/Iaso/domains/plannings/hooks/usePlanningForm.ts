import { useCallback } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { useFormik } from 'formik';
import moment from 'moment';
import { baseUrls } from 'Iaso/constants/urls';
import { useApiErrorValidation } from 'Iaso/libs/validation';
import { PageMode, Planning } from '../types';
import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from './requests/useSavePlanning';
import { usePlanningValidation } from './validation';

const toDatePickerFormat = (date?: string) =>
    date ? moment(date).format('L') : undefined;

export const usePlanningForm = (planning: Planning, mode: PageMode) => {
    const redirectToReplace = useRedirectToReplace();
    const onSaveSuccess = useCallback(
        (result: Planning) => {
            if (mode !== 'edit') {
                redirectToReplace(baseUrls.planningDetails, {
                    mode: 'edit',
                    planningId: `${result.id}`,
                });
            }
        },
        [mode, redirectToReplace],
    );
    const { mutateAsync: savePlanning } = useSavePlanning({ type: mode });
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SavePlanningQuery>, Planning>({
        mutationFn: savePlanning,
        onSuccess: onSaveSuccess,
        convertError: convertAPIErrorsToState,
    });
    const schema = usePlanningValidation(apiErrors, payload);

    return useFormik({
        initialValues: {
            id: planning.id,
            name: planning.name,
            startDate: toDatePickerFormat(planning.started_at),
            endDate: toDatePickerFormat(planning.ended_at),
            project: planning.project_details?.id,
            description: planning.description,
            publishingStatus: planning.published_at ? 'published' : 'draft',
            missions: planning.missions,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });
};

export type PlanningFormik = ReturnType<typeof usePlanningForm>;
