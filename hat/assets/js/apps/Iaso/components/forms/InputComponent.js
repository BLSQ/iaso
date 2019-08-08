import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import Select from 'react-select';

import { withStyles } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';

import PropTypes from 'prop-types';

import MESSAGES from './messages';
import ArrayFieldInput from './ArrayFieldInput';

const styles = theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(2),
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
            isClearable,
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
                            formatMessage(MESSAGES[keyValue])
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
                            formatMessage(MESSAGES[keyValue])
                        }
                    </InputLabel>
                    <Select
                        multi={false}
                        clearable={isClearable}
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
        return null;
    }
}

InputComponent.defaultProps = {
    type: 'text',
    value: undefined,
    options: [],
    onChange: () => null,
    disabled: false,
    isClearable: true,
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
    isClearable: PropTypes.bool,
};


export default withStyles(styles)(injectIntl(InputComponent));
