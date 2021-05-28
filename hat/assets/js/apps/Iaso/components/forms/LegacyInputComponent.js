import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Select,
    TextInput,
    PasswordInput,
    NumberInput,
    Radio,
    Checkbox,
    ArrayFieldInput,
    SearchInput,
} from 'bluesquare-components';
// import Select from 'react-select';
// import SearchIcon from '@material-ui/icons/Search';

// import Edit from '@material-ui/icons/Edit';
import {
    // Checkbox,
    // FormControlLabel,
    // OutlinedInput,
    withStyles,
    // Tooltip,
    // IconButton,
    // RadioGroup,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';
import grey from '@material-ui/core/colors/grey';

import MESSAGES from '../../domains/forms/messages';
// import ArrayFieldInput from './ArrayFieldInput';
// import InputLabelComponent from './InputLabelComponent';
// import FormControlComponent from './FormControlComponent';
import { translateOptions } from '../../utils/intlUtil';
import injectIntl from '../../libs/intl/injectIntl';

const styles = theme => ({
    select: {
        '& .is-disabled  .Select-control': {
            borderColor: `${grey['300']} !important`,
            cursor: 'not-allowed',
        },
        '&:hover .is-disabled  .Select-control': {
            borderColor: `${grey['300']} !important`,
        },
        '& .is-pseudo-focused .Select-control': {
            borderColor: `${theme.palette.primary.main}  !important`,
        },
        '& .is-focused .Select-control': {
            borderColor: `${theme.palette.primary.main}  !important`,
        },
        '& .is-open .Select-control': {
            borderColor: `${theme.palette.primary.main}  !important`,
            overfow: 'hidden',
        },
        '& .is-open .Select-menu-outer': {
            borderLeftColor: theme.palette.primary.main,
            borderBottomColor: theme.palette.primary.main,
            borderRightColor: theme.palette.primary.main,
            left: '1px',
        },
        '&:hover .Select-control': {
            borderColor: `${theme.palette.primary.main}  !important`,
        },
        '& .Select-control': {
            boxShadow: 'none  !important',
        },
        '& .Select--multi .Select-value': {
            height: theme.spacing(4),
            display: 'inline-block !important',
            padding: '0 !important',
            color: theme.palette.secondary.main,
            borderColor: theme.palette.secondary.main,
            backgroundColor: fade(theme.palette.secondary.main, 0.08),
        },
        '& .Select--multi .Select-value .Select-value-icon': {
            borderColor: fade(theme.palette.secondary.main, 0.24),
            width: '21px',
            height: '100%',
            paddingTop: '3px',
        },
        '& .Select--multi .Select-value .select-color': {
            display: 'inline-block',
            width: theme.spacing(2),
            height: theme.spacing(2),
            borderRadius: theme.spacing(2),
            marginRight: theme.spacing(1),
            position: 'relative',
            top: 3,
        },
        '& .Select--multi .Select-multi-value-wrapper': {
            width: '97%',
            position: 'relative',
            top: 5,
        },
        '& .Select--multi .Select-input': {
            position: 'relative',
            top: -5,
            paddingLeft: `${theme.spacing(1)}px !important`,
        },
        '& .Select--multi .Select-value-label': {
            height: '27px',
            width: 'auto',
            maxWidth: '92%',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
        },
    },
    selectError: {
        '& .Select-control': {
            borderColor: `${theme.palette.error.main} !important`,
        },
    },
    icon: {
        right: theme.spacing(2),
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    },
    searchIcon: {
        width: theme.spacing(7),
        height: '100%',
        position: 'absolute',
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: 'none',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        paddingRight: theme.spacing(7),
        width: '100%',
    },
    displayPassword: {
        position: 'absolute',
        top: 4,
        right: theme.spacing(2),
    },
    passwordInput: {
        paddingRight: theme.spacing(8),
    },
});

class InputComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // selectInputValue: '',
            isFocused: true,
            displayPassword: false,
        };
    }

    // onSelectInputChange(selectInputValue) {
    //     this.setState({
    //         selectInputValue,
    //     });
    // }

    toggleFocused(isFocused) {
        this.setState({
            isFocused,
        });
    }

    toggleDisplayPassword() {
        this.setState({
            displayPassword: !this.state.displayPassword,
        });
    }

    render() {
        const {
            classes,
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
            isSearchable,
            multi,
            uid,
        } = this.props;
        const { isFocused, displayPassword } = this.state;

        const hasErrors = errors.length > 0;
        let labelText;
        if (type !== 'radio') {
            labelText =
                labelString !== ''
                    ? labelString
                    : formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?
        }

        if (type === 'text' || type === 'email') {
            const inputValue =
                value === null || typeof value === 'undefined' ? '' : value;
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
        }
        if (type === 'password') {
            const inputValue =
                value === null || typeof value === 'undefined' ? '' : value;
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
                    classNames={{
                        passwordInput: classes.passwordInput,
                        displayPassword: classes.displayPassword,
                    }}
                    onClick={() => this.toggleDisplayPassword()}
                    displayPassword={displayPassword}
                    // tooltipMessage={formatMessage(MESSAGES.displayPassword)}
                    tooltipMessage="Caca"
                />
            );
        }
        if (type === 'number') {
            // TODO remove if not needed for number
            const inputValue =
                value === null || typeof value === 'undefined' ? '' : value;
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
        }

        // if (type === 'email') {
        //     const inputValue =
        //         value === null || typeof value === 'undefined' ? '' : value;
        //     return (
        //         <FormControlComponent
        //             withMarginTop={withMarginTop}
        //             errors={errors}
        //         >
        //             <InputLabelComponent
        //                 htmlFor={`input-text-${keyValue}`}
        //                 label={labelText}
        //                 required={required}
        //                 error={hasErrors}
        //                 shrink={value !== '' && value !== null}
        //             />
        //             <OutlinedInput
        //                 size="small"
        //                 multiline={multiline}
        //                 disabled={disabled}
        //                 id={`input-text-${keyValue}`}
        //                 value={inputValue}
        //                 type={
        //                     type === 'password' && displayPassword
        //                         ? 'text'
        //                         : type
        //                 }
        //                 onChange={event =>
        //                     onChange(keyValue, event.target.value)
        //                 }
        //                 error={hasErrors}
        //                 className={
        //                     type === 'password' ? classes.passwordInput : ''
        //                 }
        //             />
        //             {type === 'password' && (
        //                 <Tooltip
        //                     className={classes.displayPassword}
        //                     disableFocusListener={disabled}
        //                     disableHoverListener={disabled}
        //                     disableTouchListener={disabled}
        //                     placement="bottom"
        //                     title={formatMessage(MESSAGES.displayPassword)}
        //                 >
        //                     <span>
        //                         <IconButton
        //                             color={
        //                                 displayPassword ? 'primary' : 'inherit'
        //                             }
        //                             onClick={() => this.toggleDisplayPassword()}
        //                         >
        //                             <Edit />
        //                         </IconButton>
        //                     </span>
        //                 </Tooltip>
        //             )}
        //         </FormControlComponent>
        //     );
        // }
        if (type === 'select') {
            const selectClassNames = [classes.select];
            if (hasErrors) {
                selectClassNames.push(classes.selectError);
            }

            return (
                <Select
                    withMarginTop={withMarginTop}
                    errors={errors}
                    keyValue={keyValue}
                    label={labelText}
                    required={required}
                    disabled={disabled}
                    searchable={isSearchable}
                    clearable={clearable}
                    isFocused={isFocused}
                    multi={multi}
                    value={value}
                    onBlur={() => this.toggleFocused(false)}
                    onFocus={() => this.toggleFocused(true)}
                    noResultsText={formatMessage(MESSAGES.noOptions)}
                    options={translateOptions(options, formatMessage)}
                    classNames={selectClassNames}
                    onChange={newValue => {
                        onChange(keyValue, newValue);
                    }}
                />
            );

            // return (
            //     <FormControlComponent
            //         withMarginTop={withMarginTop}
            //         errors={errors}
            //     >
            //         <InputLabelComponent
            //             htmlFor={`input-select-${keyValue}`}
            //             label={labelText}
            //             shrink={
            //                 (value !== undefined && value !== null) ||
            //                 selectInputValue !== ''
            //             }
            //             isFocused={isFocused}
            //             required={required}
            //             error={hasErrors}
            //         />
            //         <div className={selectClassNames.join(' ')}>
            //             <Select
            //                 disabled={disabled}
            //                 searchable={isSearchable}
            //                 multi={multi}
            //                 clearable={clearable}
            //                 simpleValue
            //                 onInputChange={newValue => {
            //                     this.onSelectInputChange(newValue);
            //                 }}
            //                 name={keyValue}
            //                 value={value}
            //                 placeholder=""
            //                 onBlur={() => this.toggleFocused(false)}
            //                 onFocus={() => this.toggleFocused(true)}
            //                 options={translateOptions(options, formatMessage)}
            //                 noResultsText={formatMessage(MESSAGES.noOptions)}
            //                 onChange={newValue => onChange(keyValue, newValue)}
            //             />
            //         </div>
            //     </FormControlComponent>
            // );
        }
        if (type === 'arrayInput') {
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
        }
        if (type === 'search') {
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
                    classes={classes}
                    onChange={newValue => onChange(keyValue, newValue)}
                    value={value}
                />
            );
            // return (
            //     <FormControlComponent withMarginTop={withMarginTop}>
            //         <InputLabelComponent
            //             htmlFor={`search-${keyValue}`}
            //             label={labelText}
            //             required={required}
            //             shrink={
            //                 value !== undefined &&
            //                 value !== null &&
            //                 value !== ''
            //             }
            //             isFocused={isFocused}
            //         />
            //         <OutlinedInput
            //             disabled={disabled}
            //             id={uid ? `search-${uid}` : `search-${keyValue}`}
            //             value={value || ''}
            //             placeholder=""
            //             onKeyPress={event => {
            //                 if (event.which === 13 || event.keyCode === 13) {
            //                     onEnterPressed();
            //                 }
            //             }}
            //             classes={{
            //                 root: classes.inputRoot,
            //                 input: classes.inputInput,
            //             }}
            //             inputProps={{ 'aria-label': 'search' }}
            //             onChange={event =>
            //                 onChange(keyValue, event.target.value)
            //             }
            //         />
            //         <div
            //             tabIndex={0}
            //             role="button"
            //             className={classes.searchIcon}
            //             onClick={() => onEnterPressed()}
            //         >
            //             <SearchIcon />
            //         </div>
            //     </FormControlComponent>
            // );
        }
        if (type === 'checkbox') {
            return (
                <Checkbox
                    disabled={disabled}
                    onChange={newValue => onChange(keyValue, newValue)}
                    value={value}
                    label={labelText}
                />
            );
            // return (
            //     <FormControlLabel
            //         disabled={disabled}
            //         control={
            //             <Checkbox
            //                 color="primary"
            //                 checked={value === true}
            //                 onChange={event =>
            //                     onChange(keyValue, event.target.checked)
            //                 }
            //                 value="checked"
            //                 disabled={disabled}
            //             />
            //         }
            //         label={labelText}
            //     />
            // );
        }
        if (type === 'radio') {
            return (
                <Radio
                    // Will be changed to name in next commit
                    keyValue={keyValue}
                    onChange={newValue => onChange(keyValue, newValue)}
                    options={options}
                />
            );
            // return (
            //     <RadioGroup
            //         name={keyValue}
            //         value={value}
            //         onChange={event => onChange(keyValue, event.target.value)}
            //     >
            //         {options.map(o => (
            //             <FormControlLabel
            //                 key={o.value}
            //                 value={o.value}
            //                 control={<Radio color="primary" />}
            //                 label={o.label}
            //             />
            //         ))}
            //     </RadioGroup>
            // );
        }
        return null;
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
    isSearchable: true,
    multi: false,
    uid: null,
};
InputComponent.propTypes = {
    classes: PropTypes.object.isRequired,
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
    isSearchable: PropTypes.bool,
    multi: PropTypes.bool,
    uid: PropTypes.any,
};

export default injectIntl(withStyles(styles)(InputComponent));
