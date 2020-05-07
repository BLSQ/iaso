import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    IconButton,
    Tooltip,
} from '@material-ui/core';
import { Link } from 'react-router';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    popperFixed: {
        ...commonStyles(theme).popperFixed,
        marginTop: theme.spacing(1),
    },
});

function RowButtonComponent({
    classes, children, tooltipMessage, disabled, onClick, asLink, url,
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
                    {
                        !asLink
                        && children
                    }
                    {
                        asLink
                        && (
                            <Link
                                to={url}
                                className={classes.linkButton}
                            >
                                {children}
                            </Link>
                        )
                    }
                </IconButton>
            </span>
        </Tooltip>
    );
}
RowButtonComponent.defaultProps = {
    disabled: false,
    url: '',
    asLink: false,
    onClick: () => null,
};
RowButtonComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    tooltipMessage: PropTypes.object.isRequired, // TODO: make a message prop type
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    url: PropTypes.string,
    asLink: PropTypes.bool,
};
export default withStyles(styles)(RowButtonComponent);
