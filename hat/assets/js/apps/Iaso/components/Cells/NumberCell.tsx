import { FormattedNumber } from 'bluesquare-components';
import React, { FunctionComponent, ReactElement, useMemo } from 'react';
import {
    useNumberSeparatorsFromLocale,
    useThousandGroupStyle,
} from '../../hooks/useNumberSeparatorsFromLocale';

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
    thousandsGroupStyle,
}: {
    thousand?: ',' | '.';
    decimal?: ',' | '.';
    thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan';
}) => {
    const { thousand: localeThousand, decimal: localeDecimal } =
        useNumberSeparatorsFromLocale();
    const localeThousandGroupStyle = useThousandGroupStyle();

    return useMemo(() => {
        return {
            thousandSeparator: thousand ?? localeThousand,
            decimalSeparator: decimal ?? localeDecimal,
            thousandGroupStyle: thousandsGroupStyle ?? localeThousandGroupStyle,
        };
    }, [
        decimal,
        localeDecimal,
        localeThousand,
        localeThousandGroupStyle,
        thousand,
        thousandsGroupStyle,
    ]);
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
    const {
        thousandSeparator,
        decimalSeparator,
        thousandGroupStyle: localeThousandGroupStyle,
    } = useSeparators({
        thousand,
        decimal,
        thousandsGroupStyle,
    });
    return (
        <FormattedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            thousandsGroupStyle={localeThousandGroupStyle}
            thousandSeparator={thousandSeparator}
            decimalSeparator={decimalSeparator}
            decimalScale={decimalScale}
            placeholder={placeholder}
        />
    ) as ReactElement;
};
