import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useGroupSetSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        name: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
    });
};
