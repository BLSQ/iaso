/* eslint-disable camelcase */
import * as yup from 'yup';
import { mixed, object, ObjectSchema } from 'yup';
import { useMemo } from 'react';

import { useSafeIntl } from 'bluesquare-components';

import { ValidationError } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useAPIErrorValidator } from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';

import MESSAGES from '../messages';

export const useNotificationSchema = () => {
    const { formatMessage } = useSafeIntl();
    return yup.object().shape({
        epid_number: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        vdpv_category: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        source: yup
            .string()
            .trim()
            .required(formatMessage(MESSAGES.validationFieldRequired)),
        vdpv_nucleotide_diff_sabin2: yup.string().trim().nullable(),
        site_name: yup.string().trim().nullable(),
        lineage: yup.string().trim().nullable(),
        date_of_onset: yup
            .date()
            .typeError(formatMessage(MESSAGES.validationInvalidDate))
            .nullable(),
        closest_match_vdpv2: yup.string().trim().nullable(),
        date_results_received: yup
            .date()
            .typeError(formatMessage(MESSAGES.validationInvalidDate))
            .nullable(),
    });
};

export const useBulkImportNotificationSchema = (
    errors: ValidationError,
    payload: any,
): ObjectSchema<any> => {
    const { formatMessage } = useSafeIntl();
    const apiValidator = useAPIErrorValidator<Partial<any>>(errors, payload);
    return useMemo(() => {
        return object().shape({
            file: mixed()
                .nullable()
                .required(formatMessage(MESSAGES.validationFieldRequired))
                .test(apiValidator('file')),
        });
    }, [apiValidator, formatMessage]);
};
