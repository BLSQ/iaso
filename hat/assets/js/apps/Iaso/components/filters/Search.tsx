import React, { FunctionComponent, useState, useEffect } from 'react';
import {
    // @ts-ignore
    SearchInput,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';

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
        onChange(keyValue, currentValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue, keyValue]);

    useEffect(() => {
        onErrorChange(hasError);
    }, [hasError, onErrorChange]);

    useSkipEffectOnMount(() => {
        if (value !== currentValue) {
            setCurrentValue(value);
        }
    }, [value]);

    return (
        <Box mt={withMarginTop ? 2 : 0}>
            <SearchInput
                uid={uid}
                keyValue={keyValue}
                label={formatMessage(MESSAGES.textSearch)}
                required={required}
                errors={textSearchErrors}
                disabled={disabled}
                onEnterPressed={!hasError ? onEnterPressed : () => null}
                onChange={newValue => setCurrentValue(newValue)}
                value={value}
            />
        </Box>
    );
};

SearchFilter.defaultProps = {
    withMarginTop: false,
    disabled: false,
    required: false,
};

export { SearchFilter };
