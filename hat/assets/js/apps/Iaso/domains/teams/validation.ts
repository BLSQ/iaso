import { useMemo } from 'react';
import { object, string, number, array } from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

export const usePlanningValidation = () => {
    const { formatMessage } = useSafeIntl();
    const errorMessage = formatMessage(MESSAGES.requiredField);
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                name: string().nullable().required(errorMessage),
                description: string().nullable(),
                project: number().nullable().required(errorMessage),
                subTeams: array().of(number()),
                manager: number().nullable().required(errorMessage),
            }),
        [errorMessage],
    );
    return schema;
};
