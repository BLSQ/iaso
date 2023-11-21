import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { object, string, number, date, mixed } from 'yup';
import MESSAGES from '../messages';

const useVrfShape = () => {
    const { formatMessage } = useSafeIntl();
    // return useMemo(() => {
    return object().shape({
        id: string().nullable(),
        country: number()
            .required()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        campaign: string().required().nullable(),
        vaccine_type: string().required().nullable(),
        rounds: mixed().nullable().required(),
        date_vrf_signature: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_ordered_in_doses: number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        wastage_rate_used_on_vrf: number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveNumber)),
        date_vrf_reception: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_vrf_submission_orpg: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_approved_by_orpg_in_doses: number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        date_rrt_orpg_approval: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        date_vrf_submission_dg: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        quantities_approved_by_dg_in_doses: number()
            .nullable()
            .min(0, formatMessage(MESSAGES.positiveInteger))
            .integer()
            .typeError(formatMessage(MESSAGES.positiveInteger)),
        date_dg_approval: date()
            .typeError(formatMessage(MESSAGES.invalidDate))
            .nullable(),
        comments: string().nullable(),
    });
    // }, [formatMessage]);
};

export const useSupplyChainFormValidator = () => {
    const vrf = useVrfShape();
    return useMemo(() => {
        return object().shape({
            vrf,
        });
    }, [vrf]);
};
