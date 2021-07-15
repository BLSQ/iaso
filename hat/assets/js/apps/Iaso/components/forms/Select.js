import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';

import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../domains/forms/messages';

const useStyles = makeStyles(() => ({
    chipLabel: {
        marginTop: -2,
    },
    startAdornment: {
        marginTop: -5,
    },
}));

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
    loading,
    renderOption,
}) => {
    const [selectedValue, setSelectedValue] = useState(null);
    const [multiSelectedValue, setMultiSelectedValue] = useState([]);
    const intl = useSafeIntl();
    const classes = useStyles();

    const getOption = optionValue =>
        options.find(o => `${o.value}` === `${optionValue}`);

    useEffect(() => {
        if (value) {
            if (multi) {
                const newSelectedValue = [];
                const valuesList = Array.isArray(value)
                    ? value
                    : value.split(',');

                valuesList.forEach(v => {
                    const option = getOption(v);
                    if (option) newSelectedValue.push(getOption(v));
                });
                setMultiSelectedValue(newSelectedValue);
            } else {
                const newSelectedValue = getOption(value);
                if (newSelectedValue) setSelectedValue(newSelectedValue);
            }
        } else {
            multi ? setMultiSelectedValue([]) : setSelectedValue(null);
        }
    }, [value, options]);

    const handleChange = (e, newValue) => {
        if ((!multi && !newValue) || (multi && newValue.length === 0)) {
            return onChange(null);
        }
        if (multi) {
            return onChange(newValue.map(v => v && v.value).join(','));
        }
        return onChange(newValue.value);
    };
    const extraProps = {
        getOptionLabel: getOptionLabel || (option => option && option.label),
        getOptionSelected:
            getOptionSelected ||
            ((option, val) => val && option.value === val.value),
    };
    if (renderOption) {
        extraProps.renderOption = renderOption;
    }
    return (
        <Box mt={1} mb={2}>
            <Autocomplete
                noOptionsText={intl.formatMessage(noOptionsText)}
                multiple={multi}
                id={keyValue}
                disableClearable={!clearable}
                options={options}
                value={multi ? multiSelectedValue : selectedValue}
                onChange={handleChange}
                loading={loading}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        if (!option) return null;
                        return (
                            <Chip
                                classes={{
                                    label: classes.chipLabel,
                                }}
                                color="secondary"
                                label={option.label}
                                {...getTagProps({ index })}
                            />
                        );
                    })
                }
                renderInput={params => {
                    const paramsCopy = {
                        ...params,
                    };
                    let inputExtraProps = {};
                    if (extraProps.renderOption && params.inputProps.value) {
                        inputExtraProps = {
                            startAdornment: (
                                <div className={classes.startAdornment}>
                                    {extraProps.renderOption({
                                        label: params.inputProps.value,
                                    })}
                                </div>
                            ),
                            style: { color: 'transparent' },
                        };
                        inputExtraProps.startAdornment = (
                            <div className={classes.startAdornment}>
                                {extraProps.renderOption({
                                    label: params.inputProps.value,
                                })}
                            </div>
                        );
                        paramsCopy.inputProps.value = '';
                    }
                    return (
                        <TextField
                            {...paramsCopy}
                            variant="outlined"
                            disabled={disabled}
                            label={`${label}${required ? '*' : ''}`}
                            onBlur={onBlur}
                            error={errors.length > 0 && touched}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? (
                                            <CircularProgress
                                                color="inherit"
                                                size={20}
                                            />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                                ...inputExtraProps,
                            }}
                        />
                    );
                }}
                {...extraProps}
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
    loading: false,
    options: [],
    onBlur: () => {},
    getOptionSelected: null,
    getOptionLabel: null,
    renderOption: null,
    noOptionsText: MESSAGES.noOptions,
};

SelectCustom.propTypes = {
    errors: PropTypes.arrayOf(PropTypes.string),
    keyValue: PropTypes.string.isRequired,
    label: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    clearable: PropTypes.bool,
    multi: PropTypes.bool,
    value: PropTypes.any,
    onBlur: PropTypes.func,
    noOptionsText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    options: PropTypes.array,
    touched: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    loading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    getOptionLabel: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    getOptionSelected: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    renderOption: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

export { SelectCustom as Select };
