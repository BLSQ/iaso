import { useCallback } from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';

// Counts are null when the org unit is not applicable or the status is excluded
export const useFormatCount = (): ((value: number | null) => string) => {
    const { formatNumber } = useSafeIntl();
    return useCallback(
        (value: number | null) =>
            value === null ? textPlaceholder : formatNumber(value),
        [formatNumber],
    );
};
