import React from 'react';
import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';
import MESSAGES from './messages';

const styles = theme => ({
    ...commonStyles(theme),
});

function BackButton(props) {
    const { classes, goBack } = props;
    return (
        <Button variant="contained" color="primary" onClick={goBack}>
            <ArrowBackIcon className={classes.buttonIcon} />
            <FormattedMessage {...MESSAGES.back} />
        </Button>
    );
}

BackButton.propTypes = {
    classes: PropTypes.object.isRequired,
    goBack: PropTypes.func.isRequired,
};

export default withStyles(styles)(BackButton);
