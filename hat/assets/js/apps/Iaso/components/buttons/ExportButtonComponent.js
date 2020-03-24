import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import CallMade from '@material-ui/icons/CallMade';
import { withStyles, Button } from '@material-ui/core';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
});

function ExportButtonComponent({
    classes, intl, onClick, message, isDisabled
}) {
    return (
        <Button
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={onClick}
            disabled={isDisabled}
        >
            <CallMade className={classes.buttonIcon} />
            {intl.formatMessage(message)}
        </Button>
    );
}
ExportButtonComponent.defaultProps = {
    message: { id: 'iaso.label.export', defaultMessage: 'Export' },
    isDisabled: false
};
ExportButtonComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    message: PropTypes.object, // TODO: make a message prop type
};
export default withStyles(styles)(injectIntl(ExportButtonComponent));
