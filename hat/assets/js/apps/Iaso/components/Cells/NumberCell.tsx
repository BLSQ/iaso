import { FormattedNumber } from 'bluesquare-components';
import React, { FunctionComponent, ReactElement, useMemo } from 'react';
import { useNumberSeparatorsFromLocale } from '../../hooks/useNumberSeparatorsFromLocale';

type Props = {
    value?: number;
    prefix?: string;
    suffix?: string;
    thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan';
    thousandSeparator?: ',' | '.';
    decimalSeparator?: ',' | '.';
    decimalScale?: number;
    placeholder?: string | number;
};
const useSeparators = ({
    thousand,
    decimal,
}: {
    thousand?: ',' | '.';
    decimal?: ',' | '.';
}) => {
    const { thousand: localeThousand, decimal: localeDecimal } =
        useNumberSeparatorsFromLocale();
    return useMemo(() => {
        return {
            thousandSeparator: thousand ?? localeThousand,
            decimalSeparator: decimal ?? localeDecimal,
        };
    }, [decimal, localeDecimal, localeThousand, thousand]);
};

export const NumberCell: FunctionComponent<Props> = ({
    value,
    prefix,
    suffix,
    thousandsGroupStyle, // default value is already set by FormattedNumber
    thousandSeparator: thousand, // default value is already set by FormattedNumber
    decimalSeparator: decimal, // default value is already set by FormattedNumber
    decimalScale, // default value is already set by FormattedNumber
    placeholder, // default value is already set by FormattedNumber
}) => {
    const { thousandSeparator, decimalSeparator } = useSeparators({
        thousand,
        decimal,
    });
    console.log('value', value);
    return (
        <FormattedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            thousandsGroupStyle={thousandsGroupStyle}
            thousandSeparator={thousandSeparator}
            decimalSeparator={decimalSeparator}
            decimalScale={decimalScale}
            placeholder={placeholder}
        />
    ) as ReactElement;
};
