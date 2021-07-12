import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../domains/forms/messages';

const SelectCustom = ({
    value,
    keyValue,
    label,
    errors,
    onChange,
    options,
    touched,
    onBlur,
    multi,
    disabled,
    clearable,
    required,
    noOptionsText,
    getOptionLabel,
    getOptionSelected,
}) => {
    const [selectedValue, setSelectedValue] = useState(multi ? [] : null);
    const [search, setSearch] = useState(null);
    const intl = useSafeIntl();

    useEffect(() => {
        if (multi && value && Array.isArray(value)) {
            const newSelectedValue = [];
            value.forEach(v => {
                const option = options.find(o => o.value === parseInt(v, 10));
                newSelectedValue.push(option);
            });
            options.find(o => o.id === value);
            setSelectedValue(newSelectedValue || []);
        } else {
            const newSelectedValue = options.find(
                o => o.value === parseInt(value, 10),
            );
            if (multi) {
                setSelectedValue(newSelectedValue || []);
            } else {
                setSelectedValue(newSelectedValue || null);
            }
        }
    }, [value, options]);
    console.log('options', options);
    console.log('keyValue', keyValue);
    console.log('selectedValue', selectedValue);
    console.log('value', value);
    return (
        <Box mt={1} mb={3}>
            <Autocomplete
                noOptionsText={intl.formatMessage(noOptionsText)}
                multiple={multi}
                id={keyValue}
                disableClearable={!clearable}
                options={options}
                value={selectedValue}
                onInputChange={(e, newSearch) => setSearch(newSearch)}
                onChange={(e, newValue) => {
                    if (multi && newValue && Array.isArray(newValue)) {
                        return onChange(newValue.map(v => v && v.value));
                    }
                    return onChange(newValue ? newValue.value : null);
                }}
                getOptionLabel={getOptionLabel}
                getOptionSelected={getOptionSelected}
                renderInput={params => (
                    <TextField
                        {...params}
                        InputLabelProps={{
                            shrink: Boolean(value) || Boolean(search),
                        }}
                        variant="outlined"
                        disabled={disabled}
                        label={`${label}${required ? '*' : ''}`}
                        onBlur={onBlur}
                        error={errors.length > 0 && touched}
                    />
                )}
            />
        </Box>
    );
};

SelectCustom.defaultProps = {
    value: undefined,
    errors: [],
    label: '',
    multi: false,
    disabled: false,
    clearable: true,
    required: false,
    touched: false,
    searchable: true,
    options: [],
    onBlur: () => {},
    getOptionSelected: (option, selectedValue) => {
        console.log('option', option);
        console.log('selectedValue', selectedValue);
        return selectedValue && option.value === selectedValue.value;
    },
    getOptionLabel: option => option && option.label,
    noOptionsText: MESSAGES.noOptions,
};

SelectCustom.propTypes = {
    errors: PropTypes.arrayOf(PropTypes.string),
    keyValue: PropTypes.string.isRequired,
    label: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    searchable: PropTypes.bool,
    clearable: PropTypes.bool,
    multi: PropTypes.bool,
    value: PropTypes.any,
    onBlur: PropTypes.func,
    noOptionsText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    options: PropTypes.array,
    touched: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    onChange: PropTypes.func.isRequired,
    getOptionLabel: PropTypes.func,
    getOptionSelected: PropTypes.func,
};

export { SelectCustom as Select };
