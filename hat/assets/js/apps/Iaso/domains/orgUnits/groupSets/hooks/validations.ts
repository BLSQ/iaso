import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useAPIErrorValidator } from '../../../../libs/validation';
import { useMemo } from 'react';

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
        [apiValidator],
    );

    return schema;
};
