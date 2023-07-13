import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { debounce } from '@mui/material/utils';
import { Autocomplete } from '@material-ui/lab';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { Box, Chip, TextField } from '@material-ui/core';
import { isArray } from 'lodash';

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
}) => {
    const { formatMessage } = useSafeIntl();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setLoading] = useState(loading);
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
    }, [values, inputValue, fetch]);

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
                renderTags={(tags, getTagProps) => {
                    return tags.map((tag, index) => (
                        <Chip
                            color="secondary"
                            style={{
                                backgroundColor: tag.color,
                                color: 'white',
                            }}
                            label={tag.label}
                            /* eslint-disable-next-line react/jsx-props-no-spreading */
                            {...getTagProps({ index })}
                        />
                    ));
                }}
                multiple={multi}
                disabled={disabled}
                disableClearable={!clearable}
                loading={isLoading}
                loadingText={
                    loadingText ? formatMessage(loadingText) : undefined
                }
                options={[...options] ?? []}
                value={values}
                getOptionLabel={option => option?.label ?? ''}
                filterOptions={(x: any[]) => x}
                autoComplete
                includeInputInList
                filterSelectedOptions
                onChange={(event: any, newValue: any | null) => {
                    onChange(keyValue, newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                getOptionSelected={(option, val) => {
                    if (val?.value) {
                        return `${option.value}` === `${val.value}`;
                    }
                    if (val) {
                        return `${option.value}` === `${val}`;
                    }
                    return false;
                }}
            />
        </Box>
    );
};
