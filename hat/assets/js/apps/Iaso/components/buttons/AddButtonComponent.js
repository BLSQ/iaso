import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Add from '@material-ui/icons/Add';
import { withStyles, Button } from '@material-ui/core';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
});

function AddButtonComponent({ classes, onClick, message }) {
    return (
        <Button
            variant="contained"
            className={classes.button}
            color="primary"
            onClick={onClick}
        >
            <Add className={classes.buttonIcon} />
            <FormattedMessage
                id={message.id}
                defaultMessage={message.defaultMessage}
            />
        </Button>
    );
}
AddButtonComponent.defaultProps = {
    message: { id: 'iaso.label.create', defaultMessage: 'Create' },
};
AddButtonComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    message: PropTypes.object, // TODO: make a message prop type
};
export default withStyles(styles)(AddButtonComponent);
