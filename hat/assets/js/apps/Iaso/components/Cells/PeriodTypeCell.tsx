import React from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { periodTypeOptions } from 'Iaso/domains/periods/constants';

export const PeriodTypeCell = (cellInfo: { value?: string | null }) => {
    const option = periodTypeOptions.find(
        periodType => periodType.value === cellInfo.value,
    );
    if (!option?.label) {
        return textPlaceholder;
    }
    return <FormattedMessage {...option.label} />;
};
