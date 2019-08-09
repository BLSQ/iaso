import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import Select from 'react-select';

import { fade } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import SearchIcon from '@material-ui/icons/Search';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import PropTypes from 'prop-types';

import MESSAGES from './messages';
import ArrayFieldInput from './ArrayFieldInput';

const styles = theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(1),
        marginTop: theme.spacing(2),
    },
    inputLabel: {
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
    select: {
        '&:focus': {
            backgroundColor: 'white !important',
        },
    },
    icon: {
        right: theme.spacing(2),
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
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
        };
    }

    onSelectInputChange(selectInputValue) {
        this.setState({
            selectInputValue,
        });
    }

    render() {
        const {
            classes,
            type,
            keyValue,
            value,
            onChange,
            options,
            intl: {
                formatMessage,
            },
            disabled,
            clearable,
            label,
            onEnterPressed,
            checked,
        } = this.props;
        const {
            selectInputValue,
        } = this.state;
        if (type === 'text') {
            return (
                <FormControl className={classes.formControl} variant="outlined">
                    <InputLabel
                        name={keyValue}
                        htmlFor={`input-text-${keyValue}`}
                        classes={{
                            shrink: classes.shrink,
                        }}
                        className={classes.inputLabel}
                    >
                        {
                            label ? formatMessage(label) : formatMessage(MESSAGES[keyValue])
                        }
                    </InputLabel>
                    <OutlinedInput
                        disabled={disabled}
                        id={`input-text-${keyValue}`}
                        value={value}
                        onChange={event => onChange(keyValue, event.target.value)}
                    />
                </FormControl>
            );
        }
        if (type === 'select') {
            return (
                <FormControl
                    variant="outlined"
                    className={classes.formControl}
                >
                    <InputLabel
                        classes={{
                            shrink: classes.shrink,
                        }}
                        shrink={(value !== undefined && value !== null) || selectInputValue !== ''}
                        className={classes.inputLabel}
                        htmlFor={`input-select-${keyValue}`}
                    >
                        {
                            label ? formatMessage(label) : formatMessage(MESSAGES[keyValue])
                        }
                    </InputLabel>
                    <Select
                        multi={false}
                        clearable={clearable}
                        simpleValue
                        onInputChange={newValue => this.onSelectInputChange(newValue)}
                        name={keyValue}
                        value={value}
                        placeholder=""
                        options={options}
                        onChange={newValue => onChange(keyValue, newValue)}
                    />
                </FormControl>
            );
        }
        if (type === 'arrayInput') {
            return (
                <ArrayFieldInput
                    label={formatMessage(MESSAGES[keyValue])}
                    fieldList={value}
                    name={keyValue}
                    baseId={keyValue}
                    updateList={list => onChange(keyValue, list)}
                />
            );
        }
        if (type === 'search') {
            return (
                <FormControl className={classes.formControl} variant="outlined">
                    <InputLabel
                        classes={{
                            shrink: classes.shrink,
                        }}
                        className={classes.inputLabel}
                        htmlFor={`search-${keyValue}`}
                    >
                        {
                            label ? formatMessage(label) : formatMessage(MESSAGES[keyValue])
                        }
                    </InputLabel>
                    <OutlinedInput
                        disabled={disabled}
                        id={`search-${keyValue}`}
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
                </FormControl>
            );
        }
        if (type === 'checkbox') {
            return (
                <FormControlLabel
                    control={(
                        <Checkbox
                            color="primary"
                            checked={checked}
                            onChange={event => onChange(keyValue, event.target.checked)}
                            value="checkedF"
                        />
                    )}
                    label={label ? formatMessage(label) : formatMessage(MESSAGES[keyValue])}
                />
            );
        }
        return null;
    }
}

InputComponent.defaultProps = {
    type: 'text',
    value: undefined,
    options: [],
    onChange: () => null,
    disabled: false,
    clearable: true,
    label: undefined,
    checked: false,
    onEnterPressed: () => null,
};

InputComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    type: PropTypes.string,
    keyValue: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    intl: PropTypes.object.isRequired,
    options: PropTypes.array,
    disabled: PropTypes.bool,
    clearable: PropTypes.bool,
    label: PropTypes.object,
    checked: PropTypes.bool,
    onEnterPressed: PropTypes.func,
};


export default withStyles(styles)(injectIntl(InputComponent));
