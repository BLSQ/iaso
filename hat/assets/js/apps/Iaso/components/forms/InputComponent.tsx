import { Box } from '@mui/material';
import {
    ArrayFieldInput,
    BaseCountryData,
    Checkbox,
    IntlMessage,
    LangOptions,
    NumberInput,
    PasswordInput,
    PhoneInput,
    Radio,
    SearchInput,
    Select,
    TextInput,
    // @ts-ignore
    translateOptions,
    useSafeIntl,
} from 'bluesquare-components';
import React, { ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import MESSAGES from '../../domains/forms/messages';
import {
    useNumberSeparatorsFromLocale,
    useThousandGroupStyle,
} from '../../hooks/useNumberSeparatorsFromLocale';
import { DropdownOptions } from '../../types/utils';

type Option = DropdownOptions<string | number>;

export type InputComponentType =
    | 'arrayInput'
    | 'email'
    | 'checkbox'
    | 'password'
    | 'phone'
    | 'radio'
    | 'number'
    | 'search'
    | 'select'
    | 'text';

export type NumberInputOptions = {
    min?: number;
    max?: number;
    decimalScale?: number;
    decimalSeparator?: '.' | ',';
    thousandSeparator?: '.' | ',';
    thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan';
};

export type PhoneInputOptions = {
    onlyCountries?: string[];
    preferredCountries?: string[];
    excludeCountries?: string[];
    country?: string | number;
    lang?: LangOptions;
    countryCodeEditable?: boolean;
};

export type InputComponentProps = {
    type: InputComponentType;
    keyValue: string;
    value?: any;
    errors?: string[];
    onChange?: // eslint-disable-next-line no-unused-vars
    (key: string, value: any, countryData?: BaseCountryData) => void;

    options?: any[];
    disabled?: boolean;
    multiline?: boolean;
    clearable?: boolean;
    label?: IntlMessage;
    labelString?: string;
    required?: boolean;
    onEnterPressed?: () => void;
    withMarginTop?: boolean;
    multi?: boolean;
    uid?: string;
    loading?: boolean;
    // eslint-disable-next-line no-unused-vars
    getOptionLabel?: (option: Option) => string;
    getOptionSelected?: (
        // eslint-disable-next-line no-unused-vars
        option: Option,
        // eslint-disable-next-line no-unused-vars
        value: Option,
    ) => boolean;
    renderOption?: (
        // eslint-disable-next-line no-unused-vars
        option: Option,
        // eslint-disable-next-line no-unused-vars
        { inputValue }: { inputValue: string },
    ) => ReactNode;
    className?: string;
    helperText?: string;
    min?: number;
    max?: number;
    blockForbiddenChars?: boolean;
    // eslint-disable-next-line no-unused-vars
    onErrorChange?: (hasError: boolean) => void;
    numberInputOptions?: {
        prefix?: string;
        suffix?: string;
        min?: number;
        max?: number;
        decimalScale?: number;
        decimalSeparator?: '.' | ',';
        thousandSeparator?: '.' | ',';
    };
    phoneInputOptions?: PhoneInputOptions;
    // eslint-disable-next-line no-unused-vars
    setFieldError?: (keyValue: string, message: string) => void;
    autoComplete?: string;
    // eslint-disable-next-line no-unused-vars
    renderTags?: (tagValue: Array<any>, getTagProps: any) => Array<any>;
    freeSolo?: boolean; // this props i only use on single select and allow user to give an option not present in the list. Errors will be ignored
};

const useLocalizedNumberInputOptions = (
    numberInputOptions: NumberInputOptions,
): NumberInputOptions => {
    const { thousand, decimal } = useNumberSeparatorsFromLocale();
    const thousandGroupStyle = useThousandGroupStyle();
    return useMemo(
        () => ({
            ...numberInputOptions,
            decimalSeparator: numberInputOptions?.decimalSeparator ?? decimal,
            thousandSeparator:
                numberInputOptions?.thousandSeparator ?? thousand,
            thousandGroupStyle:
                numberInputOptions?.thousandsGroupStyle ?? thousandGroupStyle,
        }),
        [decimal, numberInputOptions, thousand, thousandGroupStyle],
    );
};

const InputComponent: React.FC<InputComponentProps> = ({
    type = 'text',
    keyValue,
    value,
    errors = [],
    onChange = () => null,
    options = [],
    disabled = false,
    multiline = false,
    clearable = true,
    label,
    labelString = null,
    required = false,
    onEnterPressed = () => null,
    withMarginTop = true,
    multi = false,
    uid,
    loading = false,
    getOptionLabel,
    getOptionSelected,
    renderOption,
    renderTags,
    className = '',
    helperText,
    min,
    max,
    blockForbiddenChars = false,
    onErrorChange = () => null,
    numberInputOptions = {},
    setFieldError = () => null,
    autoComplete = 'off',
    phoneInputOptions = {},
    freeSolo = false,
}) => {
    const [displayPassword, setDisplayPassword] = useState(false);
    const { formatMessage } = useSafeIntl();
    // @ts-ignore
    const activeLocale = useSelector(state => state.app.locale);

    const localizedNumberOptions =
        useLocalizedNumberInputOptions(numberInputOptions);
    const toggleDisplayPassword = () => {
        setDisplayPassword(!displayPassword);
    };
    const inputValue =
        value === null || typeof value === 'undefined' ? '' : value;
    const labelText =
        typeof labelString === 'string'
            ? labelString
            : formatMessage(label || MESSAGES[keyValue]);
    const renderInput = () => {
        switch (type) {
            case 'email':
            case 'text':
                return (
                    <TextInput
                        value={inputValue}
                        keyValue={keyValue}
                        label={labelText}
                        errors={errors}
                        required={required}
                        multiline={multiline}
                        disabled={disabled}
                        onChange={input => {
                            onChange(keyValue, input);
                        }}
                    />
                );
            case 'password':
                return (
                    <PasswordInput
                        value={inputValue}
                        keyValue={keyValue}
                        errors={errors}
                        label={labelText}
                        required={required}
                        multiline={multiline}
                        disabled={disabled}
                        onChange={input => {
                            onChange(keyValue, input);
                        }}
                        onClick={toggleDisplayPassword}
                        displayPassword={displayPassword}
                        tooltipMessage={MESSAGES.displayPassword}
                    />
                );
            case 'number':
                return (
                    <NumberInput
                        min={min}
                        max={max}
                        value={inputValue}
                        keyValue={keyValue}
                        label={labelText}
                        errors={errors}
                        required={required}
                        multiline={multiline}
                        disabled={disabled}
                        onChange={input => {
                            onChange(keyValue, input);
                        }}
                        setFieldError={setFieldError}
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...localizedNumberOptions}
                    />
                );
            case 'select':
                return (
                    <Select
                        errors={errors}
                        keyValue={keyValue}
                        label={labelText}
                        required={required}
                        disabled={disabled}
                        loading={loading}
                        clearable={clearable}
                        multi={multi}
                        value={value}
                        renderOption={renderOption}
                        getOptionLabel={getOptionLabel}
                        getOptionSelected={getOptionSelected}
                        options={translateOptions(options, formatMessage)}
                        onChange={newValue => onChange(keyValue, newValue)}
                        renderTags={renderTags}
                        helperText={helperText}
                        freeSolo={!multi && freeSolo}
                    />
                );
            case 'arrayInput':
                return (
                    <ArrayFieldInput
                        label={labelText}
                        fieldList={value}
                        baseId={keyValue}
                        updateList={list => onChange(keyValue, list)}
                    />
                );
            case 'search':
                return (
                    <SearchInput
                        uid={uid || ''}
                        keyValue={keyValue}
                        label={labelText}
                        required={required}
                        errors={errors}
                        disabled={disabled}
                        onEnterPressed={onEnterPressed}
                        onChange={newValue => onChange(keyValue, newValue)}
                        value={value}
                        blockForbiddenChars={blockForbiddenChars}
                        onErrorChange={onErrorChange}
                        autoComplete={autoComplete}
                    />
                );
            case 'checkbox':
                return (
                    <Checkbox
                        keyValue={keyValue}
                        disabled={disabled}
                        onChange={newValue => onChange(keyValue, newValue)}
                        value={value}
                        label={labelText}
                        required={required}
                    />
                );
            case 'radio':
                return (
                    <Radio
                        className={className}
                        name={keyValue}
                        label={labelText}
                        errors={errors}
                        onChange={newValue => onChange(keyValue, newValue)}
                        options={options}
                        value={value}
                        required={required}
                    />
                );
            case 'phone':
                return (
                    <PhoneInput
                        className={className}
                        label={labelText}
                        onChange={(newValue, countryData) =>
                            onChange(keyValue, newValue, countryData)
                        }
                        value={value}
                        lang={activeLocale.code}
                        required={required}
                        disabled={disabled}
                        {...phoneInputOptions}
                    />
                );
            default:
                return null;
        }
    };
    return <Box mt={withMarginTop ? 2 : 0}>{renderInput()}</Box>;
};

export default InputComponent;
