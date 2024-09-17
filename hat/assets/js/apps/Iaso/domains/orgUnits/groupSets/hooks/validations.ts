import * as yup from 'yup';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useAPIErrorValidator } from '../../../../libs/validation';
import { useMemo } from 'react';

function parseArray( value) {
    return value
}

export const useGroupSetSchema = (errors, payload) => {
    const { formatMessage } = useSafeIntl();

    console.log('debug', errors, payload);
    const apiValidator = useAPIErrorValidator(errors, payload);
    debugger;
    const schema = useMemo(
        () =>
            yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.validationFieldRequired))
                    .test(apiValidator('name')),
            //   group_ids: yup.array().transform(parseArray).of(yup.string()).test(apiValidator('group_ids')),
            }),
        [apiValidator],
    );

    return schema;
};
