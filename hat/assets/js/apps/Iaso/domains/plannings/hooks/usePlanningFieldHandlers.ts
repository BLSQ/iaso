import { useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import MESSAGES from '../messages';
import { PlanningFormik } from './usePlanningForm';

export const usePlanningFieldHandlers = (formik: PlanningFormik) => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue, touched, setFieldTouched, errors, validateField } =
        formik;

    const onChange = useCallback(
        (keyValue: string, value: any) => {
            // Teams are scoped to a project.
            if (keyValue === 'project') {
                setFieldTouched('selectedTeam', false);
                setFieldValue('selectedTeam', null);
            }
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
            // Reset validation from server to not block the user.
            // If this is not called, even changing a field won't mark the form as valid.
            validateField(keyValue);
        },
        [setFieldTouched, setFieldValue, validateField],
    );

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    return { onChange, getErrors };
};
