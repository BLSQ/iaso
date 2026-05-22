import React, {
    FocusEventHandler,
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
} from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import {
    DropdownOptions,
    IntlMessage,
    useSafeIntl,
} from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { TextInput } from './TextInput';
import { defaultRenderTags, getExtraProps, getOption } from './utils';
import { SxProps } from '@mui/material';

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

type Props = {
    keyValue: string;
    onChange: (value: any) => void;
    errors?: string[];
    label?: string;
    required?: boolean;
    disabled?: boolean;
    clearable?: boolean;
    value?: any;
    onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    loadingText?: IntlMessage;
    noOptionsText?: IntlMessage;
    helperText?: ReactNode;
    options?: DropdownOptions<any>[];
    loading?: boolean;
    getOptionLabel?: Record<string, any> | Function;
    getOptionSelected?: Record<string, any> | Function;
    renderOption?: (arg: { label: string }) => ReactNode;
    renderTags?: Function;
    returnFullObject?: boolean;
    placeholder?: string;
    dataTestId?: string;
    freeSolo?: boolean;
    sx?: SxProps;
    className?: string;
};
export const SingleSelect: FunctionComponent<Props> = ({
    sx,
    className = '',
    value,
    keyValue,
    label,
    onChange,
    helperText,
    placeholder,
    dataTestId,
    getOptionLabel,
    getOptionSelected,
    renderOption,
    errors = [],
    disabled = false,
    clearable = true,
    required = false,
    loading = false,
    options = [],
    onBlur = () => {},
    noOptionsText = MESSAGES.noOptions,
    loadingText = MESSAGES.loadingOptions,
    renderTags = defaultRenderTags,
    returnFullObject = false, // use this one if you pass array of objects as options and want an array of objects as sected items, not a string of id's
    freeSolo = false,
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
