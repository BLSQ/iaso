import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import { usePaymentStatusOptions } from '../../orgUnits/reviewChanges/hooks/api/useGetPaymentStatusOptions';
import MESSAGES from '../messages';
import { PaymentStatus } from '../types';

type Props = {
    value: PaymentStatus;
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
