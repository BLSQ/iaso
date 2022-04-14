import React, { FunctionComponent, useState, useEffect } from 'react';
import {
    SearchInput,
    useSafeIntl,
    useSkipEffectOnMount,
} from 'bluesquare-components';

import { containsForbiddenCharacter } from '../../constants/filters';
import { IntlFormatMessage } from '../../types/intl';

import MESSAGES from './messages';

type Props = {
    uid: string;
    withMarginTop?: boolean;
    keyValue: string;
    required?: boolean;
    disabled?: boolean;
    onEnterPressed: () => void;
    // eslint-disable-next-line no-unused-vars
    onChange: (newValue: string, keyValue: string) => void;
    value: string;
    // eslint-disable-next-line no-unused-vars
    onErrorChange: (hasError: boolean) => void;
};

const SearchFilter: FunctionComponent<Props> = ({
    uid,
    withMarginTop,
    keyValue,
    required,
    disabled,
    onEnterPressed,
    onChange,
    value,
    onErrorChange,
}) => {
    const [textSearchErrors, setTextSearchErrors] = useState<Array<string>>([]);
    const [hasError, setHasError] = useState<boolean>(false);
    const [currentValue, setCurrentValue] = useState<string>(value);
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    useEffect(() => {
        const hasForbiddenChar = containsForbiddenCharacter(currentValue);
        setHasError(hasForbiddenChar);
        const newErrors = hasForbiddenChar
            ? [formatMessage(MESSAGES.forbiddenChars)]
            : [];
        setTextSearchErrors(newErrors);
    }, [currentValue, formatMessage]);

    useSkipEffectOnMount(() => {
        onChange(currentValue, keyValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue, keyValue]);

    useEffect(() => {
        onErrorChange(hasError);
    }, [hasError, onErrorChange]);

    return (
        <SearchInput
            uid={uid}
            withMarginTop={withMarginTop}
            keyValue={keyValue}
            label={formatMessage(MESSAGES.textSearch)}
            required={required}
            errors={textSearchErrors}
            disabled={disabled}
            onEnterPressed={!hasError ? onEnterPressed : () => null}
            onChange={newValue => setCurrentValue(newValue)}
            value={value}
        />
    );
};

SearchFilter.defaultProps = {
    withMarginTop: false,
    disabled: false,
    required: false,
};

export { SearchFilter };
