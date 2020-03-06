import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Add from '@material-ui/icons/Add';
import { withStyles, Button } from '@material-ui/core';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
});

function AddButtonComponent({
    classes, intl, onClick, message,
}) {
    return (
        <Button
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={onClick}
        >
            <Add className={classes.buttonIcon} />
            {intl.formatMessage(message)}
        </Button>
    );
}
AddButtonComponent.defaultProps = {
    message: { id: 'iaso.label.create', defaultMessage: 'Create' },
};
AddButtonComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    message: PropTypes.object, // TODO: make a message prop type
};
export default withStyles(styles)(injectIntl(AddButtonComponent));
