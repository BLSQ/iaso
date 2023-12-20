import React from 'react';

import PropTypes from 'prop-types';
import { Button } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

function SnackBarButton(props) {
    const { messageKey, onClick } = props;
    const intl = useSafeIntl();
    return (
        <Button size="small" onClick={onClick}>
            {intl.formatMessage(MESSAGES[messageKey])}
        </Button>
    );
}

SnackBarButton.propTypes = {
    messageKey: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default SnackBarButton;
