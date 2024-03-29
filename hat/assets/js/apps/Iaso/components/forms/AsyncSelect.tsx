import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { defineMessages } from 'react-intl';
import { debounce } from '@mui/material/utils';
import Autocomplete from '@mui/material/Autocomplete';
import {
    IntlMessage,
    renderTags as defaultRenderTags,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, TextField } from '@mui/material';
import { isArray } from 'lodash';
import { AutocompleteGetTagProps } from '@mui/material/Autocomplete/Autocomplete';

const MESSAGES = defineMessages({
    noOptionsText: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
});

type Props = {
    value: any;
    label: IntlMessage;
    loading?: boolean;
    loadingText?: IntlMessage;
    keyValue: string;
    // eslint-disable-next-line no-unused-vars
    onChange: (keyValue, newValue: any | null) => void;
    errors?: string[];
    required?: boolean;
    clearable?: boolean;
    debounceTime?: number; // debounce time in ms
    disabled?: boolean;
    multi?: boolean;
    helperText?: string;
    minCharBeforeQuery?: number;
    // eslint-disable-next-line no-unused-vars
    fetchOptions: (input: string) => Promise<any[]>;
    renderTags?: (
        // eslint-disable-next-line no-unused-vars
        tag: any[],
        // eslint-disable-next-line no-unused-vars
        getTagProps: AutocompleteGetTagProps,
    ) => React.ReactNode;
};

const getOptionSelected = (option, val) => {
    if (val?.value) {
        return `${option.value}` === `${val.value}`;
    }
    if (val) {
        return `${option.value}` === `${val}`;
    }
    return false;
};

export const AsyncSelect: FunctionComponent<Props> = ({
    value,
    onChange,
    keyValue,
    label,
    loading = false,
    loadingText = undefined,
    required = false,
    clearable = false,
    debounceTime = 0,
    disabled = false,
    multi = false,
    helperText = undefined,
    minCharBeforeQuery = 1,
    fetchOptions,
    renderTags = defaultRenderTags(o => (o?.label ? o.label : '')),
}) => {
    const { formatMessage } = useSafeIntl();
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setLoading] = useState<boolean>(loading);
    const values = useMemo(() => {
        if (isArray(value)) {
            return value;
        }
        return value.length > 0
            ? value.split(',').map(v => {
                  return {
                      value: v,
                      label: v,
                  };
              })
            : [];
    }, [value]);
    const [options, setOptions] = useState<readonly any[]>([...values]);

    const fetch = useMemo(
        () =>
            debounce(
                (
                    request: { input: string },
                    // eslint-disable-next-line no-unused-vars
                    callback: (results?: readonly any[]) => void,
                ) => {
                    setLoading(true);
                    fetchOptions(request.input)
                        .then(newOptions => {
                            callback(newOptions);
                            setLoading(false);
                        })
                        .catch(() => {
                            setLoading(false);
                        });
                },
                debounceTime,
            ),
        [debounceTime, fetchOptions],
    );

    useEffect(() => {
        let active = true;
        if (inputValue.length < minCharBeforeQuery) {
            setOptions([...values]);
            return undefined;
        }

        fetch({ input: inputValue }, (results?: readonly any[]) => {
            if (active) {
                let newOptions: any[] = [...values];
                if (results) {
                    newOptions = [...newOptions, ...results];
                }
                setOptions(newOptions);
            }
        });
        return () => {
            active = false;
        };
    }, [values, inputValue, fetch, minCharBeforeQuery]);
    const displayedOtpions = useMemo(() => [...options] ?? [], [options]);
    return (
        <Box>
            <Autocomplete
                id={keyValue}
                renderInput={params => (
                    <TextField
                        /* eslint-disable-next-line react/jsx-props-no-spreading */
                        {...params}
                        id={keyValue}
                        disabled={disabled}
                        label={formatMessage(label)}
                        required={required}
                        helperText={helperText}
                    />
                )}
                renderTags={renderTags}
                multiple={multi}
                disabled={disabled}
                disableClearable={!clearable}
                loading={isLoading}
                loadingText={
                    loadingText ? formatMessage(loadingText) : undefined
                }
                options={displayedOtpions}
                value={values}
                getOptionLabel={option => option?.label ?? ''}
                filterOptions={(x: any[]) => x}
                autoComplete
                noOptionsText={formatMessage(MESSAGES.noOptionsText)}
                includeInputInList
                filterSelectedOptions
                onChange={(_, newValue: any | null) => {
                    onChange(keyValue, newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                isOptionEqualToValue={getOptionSelected}
            />
        </Box>
    );
};
