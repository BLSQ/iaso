import { useCallback } from 'react';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';

export const useFormatCount = (): ((value: number | null) => string) => {
    const { formatNumber } = useSafeIntl();
    return useCallback(
        (value: number | null) =>
            value === null ? textPlaceholder : formatNumber(value),
        [formatNumber],
    );
};
