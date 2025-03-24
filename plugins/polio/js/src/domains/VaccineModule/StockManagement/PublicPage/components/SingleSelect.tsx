/* eslint-disable react/forbid-prop-types */
import React, { useCallback, useMemo } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import PropTypes from 'prop-types';

import { defineMessages } from 'react-intl';

import { TextInput } from './TextInput';
import { defaultRenderTags, getExtraProps, getOption } from './utils';

const styles = theme => ({
    inputLabel: {
        color: 'rgba(0, 0, 0, 0.4)',
        paddingLeft: 3,
        paddingRight: 3,
        transition: theme.transitions.create(['all'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    shrink: {
        fontSize: 20,
        marginTop: -2,
        backgroundColor: 'white',
    },
    popupIndicator: {
        marginRight: '6px !important',
        marginLeft: '6px !important',
    },
    clearIndicator: {
        marginTop: -2,
    },
    hasClearIcon: {
        '& .MuiAutocomplete-inputRoot': {
            paddingRight: '85px !important',
        },
    },
});

const useStyles = makeStyles(styles);

const powerBIStyles = {
    main: {
        '& div.MuiInputBase-root': { padding: 0, borderRadius: 0 },
    },
};
const usePowerBIStyles = makeStyles(powerBIStyles);

export { styles, useStyles };

const MESSAGES = defineMessages({
    noOptions: {
        id: 'blsq.button.label.noOptions',
        defaultMessage: 'No results found',
    },
    valueNotFound: {
        id: 'blsq.button.label.valueNotFound',
        defaultMessage: 'Value not found in possible options',
    },
    oneValueNotFound: {
        id: 'blsq.button.label.oneValueNotFound',
        defaultMessage: 'Value "{value}" not found in possible options',
    },
    loadingOptions: {
        id: 'blsq.select.label.loadingText',
        defaultMessage: 'Loading...',
    },
});

export { MESSAGES };

const SingleSelect = ({
    sx,
    className = '',
    value,
    keyValue,
    label,
    errors,
    onChange,
    options,
    onBlur,
    disabled,
    clearable,
    required,
    noOptionsText,
    getOptionLabel,
    getOptionSelected,
    loading,
    loadingText,
    renderOption,
    renderTags,
    returnFullObject,
    helperText,
    placeholder,
    freeSolo,
    dataTestId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const powerBiClasses = usePowerBIStyles();
    //  Handle numeric 0 as value
    const hasValue = Boolean(value) || value === 0;

    const displayedErrors = useMemo(() => {
        const tempErrors = [...errors];
        if (!freeSolo) {
            const missingValueError = !getOption(value, options);
            if (hasValue && !loading && missingValueError) {
                tempErrors.push(formatMessage(MESSAGES.valueNotFound));
            }
        }
        return tempErrors;
    }, [value, options, errors, loading, hasValue]);

    const fixedValue = useMemo(
        () => (hasValue ? (getOption(value, options) ?? value) : null),
        [value, options, hasValue],
    );

    const handleChange = useCallback(
        (e, newValue) => onChange(newValue?.value ?? null),
        [onChange, returnFullObject],
    );

    const extraProps = getExtraProps(
        getOptionLabel,
        getOptionSelected,
        renderOption,
    );
    const handleInputChange = useCallback(
        (_, newInputValue) => freeSolo && onChange(newInputValue),
        [onChange, returnFullObject],
    );

    return (
        <Box>
            <Autocomplete
                sx={sx ?? { backgroundColor: 'white', borderRadius: '0' }}
                className={className || powerBiClasses.main}
                disabled={disabled}
                freeSolo={freeSolo}
                onInputChange={handleInputChange}
                noOptionsText={formatMessage(noOptionsText)}
                multiple={false}
                id={keyValue}
                disableClearable={!clearable}
                options={options}
                value={fixedValue}
                onChange={handleChange}
                loading={loading}
                loadingText={formatMessage(loadingText)}
                clearIcon={<ClearIcon />}
                renderTags={renderTags}
                renderInput={params => (
                    <TextInput
                        // @ts-ignore
                        params={params}
                        renderOption={renderOption}
                        disabled={disabled}
                        label={label}
                        required={required}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        errors={displayedErrors}
                        helperText={helperText}
                        loading={loading}
                        dataTestId={dataTestId}
                    />
                )}
                classes={{
                    popupIndicator: classes.popupIndicator,
                    clearIndicator: classes.clearIndicator,
                    hasClearIcon: classes.hasClearIcon,
                }}
                {...extraProps}
            />
        </Box>
    );
};

SingleSelect.defaultProps = {
    value: undefined,
    errors: [],
    label: undefined,
    disabled: false,
    clearable: true,
    required: false,
    loading: false,
    options: [],
    onBlur: () => {},
    getOptionSelected: null,
    getOptionLabel: null,
    renderOption: null,
    noOptionsText: MESSAGES.noOptions,
    loadingText: MESSAGES.loadingOptions,
    helperText: undefined,
    renderTags: defaultRenderTags,
    returnFullObject: false, // use this one if you pass array of objects as options and want an array of objects as sected items, not a string of id's
    placeholder: undefined,
    dataTestId: undefined,
    freeSolo: false,
    sx: undefined,
    className: '',
};

SingleSelect.propTypes = {
    errors: PropTypes.arrayOf(PropTypes.string),
    keyValue: PropTypes.string.isRequired,
    label: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    clearable: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.any,
    onBlur: PropTypes.func,
    loadingText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    noOptionsText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    helperText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.array,
    loading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    getOptionLabel: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    getOptionSelected: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    renderOption: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    renderTags: PropTypes.func,
    returnFullObject: PropTypes.bool,
    placeholder: PropTypes.string,
    dataTestId: PropTypes.string,
    freeSolo: PropTypes.bool,
    sx: PropTypes.any,
    className: PropTypes.string,
};

export { SingleSelect };
