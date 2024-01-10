import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Locale } from '../types/general';
import { THOUSAND_GROUP_STYLES } from '../domains/app/constants';

export const useThousandGroupStyle = (): 'thousand' | 'lakh' | 'wan' => {
    // @ts-ignore
    const activeLocale: Locale = useSelector(state => state.app.locale);
    return THOUSAND_GROUP_STYLES[activeLocale.code];
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
