import React, { FunctionComponent } from 'react';

import { IntlMessage, useSafeIntl, FakeInput } from 'bluesquare-components';

type Props = {
    label: IntlMessage;
    value: string;
    onClick: () => void;
    dataTestId?: string;
    onClear: () => void;
};

export const TriggerModal: FunctionComponent<Props> = ({
    label,
    value,
    onClick,
    dataTestId,
    onClear,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <FakeInput
            onClick={onClick}
            value={value}
            dataTestId={`open-query-builder-${dataTestId || 'default'}`}
            label={formatMessage(label)}
            onClear={onClear}
            fixedHeight={false}
        />
    );
};
