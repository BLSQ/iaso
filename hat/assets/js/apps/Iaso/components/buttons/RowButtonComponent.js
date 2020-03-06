import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    IconButton,
    Tooltip,
} from '@material-ui/core';

import commonStyles from '../../styles/common';

const styles = theme => ({
    popperFixed: {
        ...commonStyles(theme).popperFixed,
        marginTop: theme.spacing(1),
    },
});

function RowButtonComponent({
    classes, children, tooltipMessage, disabled, onClick,
}) {
    return (
        <Tooltip
            classes={{ popper: classes.popperFixed }}
            disableFocusListener={disabled}
            disableHoverListener={disabled}
            disableTouchListener={disabled}
            placement="bottom"
            title={<FormattedMessage {...tooltipMessage} />}
        >
            <span>
                <IconButton disabled={disabled} onClick={onClick}>
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
}
RowButtonComponent.defaultProps = {
    disabled: false,
};
RowButtonComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    tooltipMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
};
export default withStyles(styles)(RowButtonComponent);
