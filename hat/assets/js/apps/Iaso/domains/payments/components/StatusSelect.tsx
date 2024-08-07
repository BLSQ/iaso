import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { PaymentStatus } from '../types';
import { usePaymentStatusOptions } from '../../orgUnits/reviewChanges/hooks/api/useGetPaymentStatusOptions';

type Props = {
    value: PaymentStatus;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: PaymentStatus) => void;
};

export const StatusSelect: FunctionComponent<Props> = ({ value, onChange }) => {
    const { formatMessage } = useSafeIntl();
    const { data: paymentStatusOptions, isFetching } =
        usePaymentStatusOptions();
    return (
        <InputComponent
            type="select"
            keyValue="status"
            value={value}
            clearable={false}
            required
            onChange={(_, newValue) => onChange(newValue)}
            labelString={formatMessage(MESSAGES.changeStatus)}
            options={paymentStatusOptions}
            loading={isFetching}
        />
    );
};
