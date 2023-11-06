import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    TextInput,
    PasswordInput,
    NumberInput,
    Radio,
    Checkbox,
    ArrayFieldInput,
    SearchInput,
    translateOptions,
    injectIntl,
    Select,
} from 'bluesquare-components';
import { Box } from '@material-ui/core';
import MESSAGES from '../../domains/forms/messages';

class InputComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isFocused: false,
        };
    }

    render() {
        const {
            type,
            keyValue,
            value,
            errors,
            onChange,
            options,
            intl: { formatMessage },
            disabled,
            multiline,
            clearable,
            label,
            labelString,
            required,
            onEnterPressed,
            withMarginTop,
            multi,
            uid,
            loading,
            getOptionSelected,
            getOptionLabel,
            renderOption,
            className,
            helperText,
            min,
            max,
            blockForbiddenChars,
            onErrorChange,
            numberInputOptions,
        } = this.props;
        const { isFocused, displayPassword } = this.state;
        const labelText =
            typeof labelString === 'string'
                ? labelString
                : formatMessage(label || MESSAGES[keyValue]);
        const inputValue =
            value === null || typeof value === 'undefined' ? '' : value;

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
                            onClick={() => this.toggleDisplayPassword()}
                            displayPassword={displayPassword}
                            tooltipMessage={formatMessage(
                                MESSAGES.displayPassword,
                            )}
                        />
                    );
                case 'number':
                    // TODO remove inputValue if not needed for number
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
                            {...numberInputOptions}
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
                            onChange={newValue => {
                                onChange(keyValue, newValue);
                            }}
                            helperText={helperText}
                        />
                    );
                case 'arrayInput':
                    // TODO: implement required, errors...
                    return (
                        <ArrayFieldInput
                            label={labelText}
                            fieldList={value}
                            name={keyValue}
                            baseId={keyValue}
                            updateList={list => onChange(keyValue, list)}
                        />
                    );
                case 'search':
                    // TODO investigate isFocused prop. It doesn't seem tyo do anything
                    return (
                        <SearchInput
                            uid={uid}
                            keyValue={keyValue}
                            label={labelText}
                            required={required}
                            errors={errors}
                            disabled={disabled}
                            onEnterPressed={onEnterPressed}
                            isFocused={isFocused}
                            onChange={newValue => onChange(keyValue, newValue)}
                            value={value}
                            blockForbiddenChars={blockForbiddenChars}
                            onErrorChange={onErrorChange}
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
                            error={errors}
                            onChange={newValue => onChange(keyValue, newValue)}
                            options={options}
                            value={value}
                            required={required}
                        />
                    );
                default:
                    return null;
            }
        };
        return <Box mt={withMarginTop ? 2 : 0}>{renderInput()}</Box>;
    }
}
InputComponent.defaultProps = {
    type: 'text',
    value: undefined,
    errors: [],
    options: [],
    disabled: false,
    multiline: false,
    clearable: true,
    label: undefined,
    labelString: null,
    required: false,
    onEnterPressed: () => null,
    onChange: () => null,
    withMarginTop: true,
    multi: false,
    uid: null,
    loading: false,
    getOptionLabel: null,
    getOptionSelected: null,
    renderOption: null,
    className: '',
    helperText: undefined,
    min: undefined,
    max: undefined,
    blockForbiddenChars: false,
    onErrorChange: () => null,
    numberInputOptions: undefined,
};
InputComponent.propTypes = {
    type: PropTypes.string,
    keyValue: PropTypes.string.isRequired,
    value: PropTypes.any,
    errors: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
    intl: PropTypes.object.isRequired,
    options: PropTypes.array,
    disabled: PropTypes.bool,
    multiline: PropTypes.bool,
    clearable: PropTypes.bool,
    label: PropTypes.object,
    labelString: PropTypes.string,
    required: PropTypes.bool,
    onEnterPressed: PropTypes.func,
    withMarginTop: PropTypes.bool,
    multi: PropTypes.bool,
    loading: PropTypes.bool,
    uid: PropTypes.any,
    getOptionLabel: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    getOptionSelected: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    renderOption: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    className: PropTypes.string,
    helperText: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    blockForbiddenChars: PropTypes.bool,
    onErrorChange: PropTypes.func,
    numberInputOptions: PropTypes.object,
};

const translated = injectIntl(InputComponent);
export default translated;
