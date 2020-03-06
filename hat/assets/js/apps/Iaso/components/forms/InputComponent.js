import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Select from 'react-select';
import { withStyles } from '@material-ui/core';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import SearchIcon from '@material-ui/icons/Search';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { fade } from '@material-ui/core/styles/colorManipulator';
import grey from '@material-ui/core/colors/grey';

import MESSAGES from './messages';
import ArrayFieldInput from './ArrayFieldInput';
import InputLabelComponent from './InputLabelComponent';
import FormControlComponent from './FormControlComponent';
import { translateOptions } from '../../utils/intlUtil';

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
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            maxWidth: '20vw',
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
        pointerEvents: 'none',
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        paddingRight: theme.spacing(7),
        width: '100%',
    },
});

class InputComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectInputValue: '',
            isFocused: false,
        };
    }

    onSelectInputChange(selectInputValue) {
        this.setState({
            selectInputValue,
        });
    }

    toggleFocused(isFocused) {
        this.setState({
            isFocused,
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
            intl: {
                formatMessage,
            },
            disabled,
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
        const {
            selectInputValue,
            isFocused,
        } = this.state;

        const hasErrors = errors.length > 0;

        const labelText = labelString !== ''
            ? labelString
            : formatMessage(label || MESSAGES[keyValue]); // TODO: move in label component?

        if (type === 'text' || type === 'number') {
            const inputValue = (value === null || typeof value === 'undefined')
                ? ''
                : value;

            return (
                <FormControlComponent withMarginTop={withMarginTop} errors={errors}>
                    <InputLabelComponent
                        htmlFor={`input-text-${keyValue}`}
                        label={labelText}
                        required={required}
                    />
                    <OutlinedInput
                        size="small"
                        disabled={disabled}
                        id={`input-text-${keyValue}`}
                        value={inputValue}
                        type={type}
                        onChange={event => onChange(keyValue, event.target.value)}
                        error={hasErrors}
                    />
                </FormControlComponent>
            );
        }
        if (type === 'select') {
            const selectClassNames = [classes.select];
            if (hasErrors) {
                selectClassNames.push(classes.selectError);
            }

            return (
                <FormControlComponent withMarginTop={withMarginTop} errors={errors}>
                    <InputLabelComponent
                        htmlFor={`input-select-${keyValue}`}
                        label={labelText}
                        shrink={(value !== undefined && value !== null) || selectInputValue !== ''}
                        isFocused={isFocused}
                        required={required}
                    />
                    <div className={selectClassNames.join(' ')}>
                        <Select
                            disabled={disabled}
                            searchable={isSearchable}
                            multi={multi}
                            clearable={clearable}
                            simpleValue
                            onInputChange={newValue => this.onSelectInputChange(newValue)}
                            name={keyValue}
                            value={value}
                            placeholder=""
                            onBlur={() => this.toggleFocused(false)}
                            onFocus={() => this.toggleFocused(true)}
                            options={translateOptions(options, formatMessage)}
                            noResultsText={formatMessage({
                                id: 'iaso.label.noOptions',
                                defaultMessage: 'No results found',
                            })}
                            onChange={newValue => onChange(keyValue, newValue)}
                        />
                    </div>
                </FormControlComponent>
            );
        }
        if (type === 'arrayInput') { // TODO: implement required, errors...
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
                <FormControlComponent withMarginTop={withMarginTop}>
                    <InputLabelComponent
                        htmlFor={`search-${keyValue}`}
                        label={labelText}
                        required={required}
                    />
                    <OutlinedInput
                        disabled={disabled}
                        id={uid ? `search-${uid}` : `search-${keyValue}`}
                        value={value || ''}
                        placeholder=""
                        onKeyPress={(event) => {
                            if (event.which === 13 || event.keyCode === 13) {
                                onEnterPressed();
                            }
                        }}
                        classes={{
                            root: classes.inputRoot,
                            input: classes.inputInput,
                        }}
                        inputProps={{ 'aria-label': 'search' }}
                        onChange={event => onChange(keyValue, event.target.value)}
                    />
                    <div className={classes.searchIcon}>
                        <SearchIcon />
                    </div>
                </FormControlComponent>
            );
        }
        if (type === 'checkbox') {
            return (
                <FormControlLabel
                    disabled={disabled}
                    control={(
                        <Checkbox
                            color="primary"
                            checked={value === true}
                            onChange={event => onChange(keyValue, event.target.checked)}
                            value="checked"
                            disabled={disabled}
                        />
                    )}
                    label={labelText}
                />
            );
        }
        return null;
    }
}
InputComponent.defaultProps = {
    type: 'text',
    value: undefined,
    errors: [],
    options: [],
    onChange: () => null,
    disabled: false,
    clearable: true,
    label: undefined,
    labelString: '',
    required: false,
    onEnterPressed: () => null,
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
