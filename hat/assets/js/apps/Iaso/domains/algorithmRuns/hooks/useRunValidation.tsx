import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';
import { MESSAGES } from '../messages';

export const useRunValidation = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () =>
            yup.object().shape({
                algoId: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.requiredField)),
                sourceOriginId: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.requiredField)),
                versionOrigin: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.requiredField)),
                sourceDestinationId: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.requiredField)),
                versionDestination: yup
                    .number()
                    .nullable()
                    .required(formatMessage(MESSAGES.requiredField)),
            }),
        [formatMessage],
    );
};
