import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { THOUSAND, THOUSAND_GROUP_STYLES } from '../domains/app/constants';
import { useLocale } from '../domains/app/contexts/LocaleContext';

export const useThousandGroupStyle = (): 'thousand' | 'lakh' | 'wan' => {
    const { locale: activeLocale } = useLocale();
    return THOUSAND_GROUP_STYLES[activeLocale] ?? THOUSAND;
};

export const useNumberSeparatorsFromLocale = (): {
    thousand: '.' | ',';
    decimal: '.' | ',';
} => {
    const { formatNumber } = useSafeIntl();
    const decimal = formatNumber(1.1).charAt(1);
    const thousand = formatNumber(1000).charAt(1);

    return useMemo(() => ({ decimal, thousand }), [decimal, thousand]);
};
