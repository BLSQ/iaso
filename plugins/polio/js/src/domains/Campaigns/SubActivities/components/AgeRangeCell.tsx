import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React from 'react';
import MESSAGES from '../messages';

export const AgeRangeCell = settings => {
    const { formatMessage } = useSafeIntl();
    const { age_unit, age_min, age_max } = settings?.row?.original ?? {};
    if (!age_min && !age_max && !age_unit) {
        return <span>{textPlaceholder}</span>;
    }
    return (
        <span>
            {`${age_min ?? textPlaceholder}-${age_max ?? textPlaceholder} (${
                age_unit ? formatMessage(MESSAGES[age_unit]) : textPlaceholder
            })`}
        </span>
    );
};
