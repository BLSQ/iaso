import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import * as yup from 'yup';

import { useAPIErrorValidator } from '../../../../libs/validation';
import MESSAGES from '../messages';

export const useGroupSetSchema = (errors, payload) => {
    const { formatMessage } = useSafeIntl();

    const apiValidator = useAPIErrorValidator(errors, payload);
    const schema = useMemo(
        () =>
            yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.validationFieldRequired))
                    .test(apiValidator('name')),
                group_ids: yup
                    .array()
                    .of(yup.number())
                    .test(apiValidator('group_ids')),
            }),
        [apiValidator, formatMessage],
    );

    return schema;
};
