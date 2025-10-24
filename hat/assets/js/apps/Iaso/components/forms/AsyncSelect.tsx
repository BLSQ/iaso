import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Box, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { AutocompleteRenderGetTagProps } from '@mui/material/Autocomplete/Autocomplete';
import { debounce } from '@mui/material/utils';
import {
    IntlMessage,
    renderTags as defaultRenderTags,
    useSafeIntl,
} from 'bluesquare-components';
import { isArray } from 'lodash';
import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    noOptionsText: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
    noResultsFound: {
        id: 'iaso.forms.noResultsFound',
        defaultMessage: 'No results found',
    },
});

type Props = {
    value: any;
    label: IntlMessage;
    loading?: boolean;
    loadingText?: IntlMessage;
    keyValue: string;
    onChange: (keyValue, newValue: any | null) => void;
    errors?: string[];
    required?: boolean;
    clearable?: boolean;
    debounceTime?: number; // debounce time in ms
    disabled?: boolean;
    multi?: boolean;
    helperText?: string;
    minCharBeforeQuery?: number;
    fetchOptions: (input: string) => Promise<any>;
    renderTags?: (
        tag: any[],
        getTagProps: AutocompleteRenderGetTagProps,
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
    const [hasSearched, setHasSearched] = useState<boolean>(false);
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
                    callback: (results?: readonly any[]) => void,
                ) => {
                    setLoading(true);
                    setHasSearched(true);
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
            setHasSearched(false);
            return undefined;
        }

        fetch({ input: inputValue }, (results?: readonly any[]) => {
            if (active) {
                let newOptions: any[] = [...values];
                if (results) {
                    newOptions = [...newOptions, ...results];
                    // Make the array unique by `value` key.
                    newOptions = [
                        ...new Map(
                            newOptions.map(item => [item.value, item]),
                        ).values(),
                    ];
                }
                setOptions(newOptions);
            }
        });
        return () => {
            active = false;
        };
    }, [values, inputValue, fetch, minCharBeforeQuery]);
    const displayedOptions = useMemo(() => [...options] ?? [], [options]);
    const shouldDisplayOptionsText =
        hasSearched &&
        displayedOptions.length === 0 &&
        inputValue.length >= minCharBeforeQuery;
    return (
        <Box>
            <Autocomplete
                id={keyValue}
                renderInput={params => (
                    <TextField
                        {...params}
                        id={keyValue}
                        disabled={disabled}
                        label={formatMessage(label)}
                        required={required}
                        helperText={helperText}
                        placeholder={
                            inputValue.length < minCharBeforeQuery
                                ? formatMessage(MESSAGES.noOptionsText)
                                : undefined
                        }
                    />
                )}
                renderTags={renderTags}
                multiple={multi}
                disabled={disabled}
                disableClearable={!clearable}
                loading={isLoading}
                loadingText={
                    loadingText && inputValue.length >= minCharBeforeQuery
                        ? formatMessage(loadingText)
                        : undefined
                }
                options={displayedOptions}
                value={multi ? values : values.length > 0 && values[0]}
                getOptionLabel={option => option?.label ?? ''}
                filterOptions={(x: any[]) => x}
                autoComplete
                noOptionsText={
                    shouldDisplayOptionsText
                        ? formatMessage(MESSAGES.noResultsFound)
                        : undefined
                }
                includeInputInList
                filterSelectedOptions
                onChange={(_, newValue: any | null) => {
                    onChange(keyValue, newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                isOptionEqualToValue={getOptionSelected}
                freeSolo={!shouldDisplayOptionsText}
            />
        </Box>
    );
};
