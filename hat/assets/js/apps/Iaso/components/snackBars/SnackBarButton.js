import React from 'react';

import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';

import MESSAGES from './messages';
import injectIntl from '../../libs/intl/injectIntl';

function SnackBarButton(props) {
    const {
        messageKey,
        onClick,
        intl: { formatMessage },
    } = props;
    return (
        <Button size="small" onClick={onClick}>
            {formatMessage(MESSAGES[messageKey])}
        </Button>
    );
}

SnackBarButton.propTypes = {
    messageKey: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(SnackBarButton);
