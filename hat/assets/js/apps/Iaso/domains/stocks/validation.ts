import { useMemo } from 'react';
import { object, number, ObjectSchema, string } from 'yup';
import { useSafeIntl } from 'bluesquare-components';
import { ValidationError } from '../../types/utils';

import { useAPIErrorValidator } from '../../libs/validation';
import { SaveStockMovementQuery } from './hooks/requests/useSaveStockMovement';
import MESSAGES from './messages';

export const useStockMovementValidation = (
    errors: ValidationError = {},
    payload: Partial<SaveStockMovementQuery>,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const apiValidator = useAPIErrorValidator<Partial<SaveStockMovementQuery>>(
        errors,
        payload,
    );
    const schema = useMemo(() => {
        return object().shape({
            quantity: number()
                .nullable()
                .typeError(formatMessage(MESSAGES.quantityError))
                .required(formatMessage(MESSAGES.required)),
            org_unit: number()
                .nullable()
                .required(formatMessage(MESSAGES.required))
                .test(apiValidator('org_unit')),
            stock_item: number()
                .nullable()
                .required(formatMessage(MESSAGES.required))
                .test(apiValidator('stock_item')),
        });
    }, [formatMessage, apiValidator]);
    return schema;
};
