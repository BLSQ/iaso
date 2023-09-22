import { useMemo } from 'react';
import { object, number, ObjectSchema } from 'yup';
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
                .required('requiredField'),
            org_unit: number()
                .nullable()
                .test(apiValidator('org_unit'))
                .required('requiredField'),
            stock_item: number()
                .nullable()
                .test(apiValidator('stock_item'))
                .required('requiredField'),
        });
    }, [formatMessage, apiValidator]);
    return schema;
};
