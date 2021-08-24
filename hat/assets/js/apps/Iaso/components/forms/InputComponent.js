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
import { FormControl, FormLabel } from '@material-ui/core';
import MESSAGES from '../../domains/forms/messages';

/**
 * @deprecated
 * Import specific components from bluesquare-components library instead
 */
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
        } = this.props;
        const { isFocused, displayPassword } = this.state;
        const labelText =
            labelString !== ''
                ? labelString
                : formatMessage(label || MESSAGES[keyValue]);
        const inputValue =
            value === null || typeof value === 'undefined' ? '' : value;

        switch (type) {
            case 'email':
            case 'text':
                return (
                    <TextInput
                        value={inputValue}
                        keyValue={keyValue}
                        label={labelText}
                        withMarginTop={withMarginTop}
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
                        withMarginTop={withMarginTop}
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
                        tooltipMessage={formatMessage(MESSAGES.displayPassword)}
                    />
                );
            case 'number':
                // TODO remove inputValue if not needed for number
                return (
                    <NumberInput
                        value={inputValue}
                        keyValue={keyValue}
                        label={labelText}
                        withMarginTop={withMarginTop}
                        errors={errors}
                        required={required}
                        multiline={multiline}
                        disabled={disabled}
                        onChange={input => {
                            onChange(keyValue, input);
                        }}
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
                        withMarginTop={withMarginTop}
                        keyValue={keyValue}
                        label={labelText}
                        required={required}
                        disabled={disabled}
                        onEnterPressed={onEnterPressed}
                        isFocused={isFocused}
                        onChange={newValue => onChange(keyValue, newValue)}
                        value={value}
                    />
                );
            case 'checkbox':
                return (
                    <Checkbox
                        disabled={disabled}
                        onChange={newValue => onChange(keyValue, newValue)}
                        value={value}
                        label={labelText}
                    />
                );
            case 'radio':
                return (
                    <FormControl
                        component="fieldset"
                        error={errors.length > 0}
                        variant="outlined"
                    >
                        <FormLabel style={{ fontSize: 12 }} component="legend">
                            {labelText}
                        </FormLabel>
                        <Radio
                            className={className}
                            name={keyValue}
                            onChange={newValue => onChange(keyValue, newValue)}
                            options={options}
                            value={value}
                        />
                    </FormControl>
                );
            default:
                return null;
        }
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
    labelString: '',
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
};

const translated = injectIntl(InputComponent);
export default translated;
