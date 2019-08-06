import React from 'react';
import { injectIntl } from 'react-intl';

import { withStyles } from '@material-ui/core';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';

import PropTypes from 'prop-types';

import MESSAGES from './messages';

const styles = theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    inputLabel: {
        backgroundColor: 'white',
        paddingLeft: 3,
        paddingRight: 3,
    },
});

function InputComponent(props) {
    const {
        classes,
        type,
        keyValue,
        value,
        onChange,
        intl: {
            formatMessage,
        },
    } = props;
    const labelRef = React.useRef(null);
    if (type === 'text') {
        return (
            <FormControl className={classes.formControl} variant="outlined">
                <InputLabel
                    ref={labelRef}
                    htmlFor={`input-text-${keyValue}`}
                    className={classes.inputLabel}
                >
                    {
                        formatMessage(MESSAGES[keyValue])
                    }
                </InputLabel>
                <OutlinedInput
                    id={`input-text-${keyValue}`}
                    value={value}
                    onChange={newValue => onChange(keyValue, newValue)}
                />
            </FormControl>
        );
    }
    return null;
}

InputComponent.defaultProps = {
    type: 'text',
};

InputComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    type: PropTypes.string,
    keyValue: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
};


export default withStyles(styles)(injectIntl(InputComponent));
