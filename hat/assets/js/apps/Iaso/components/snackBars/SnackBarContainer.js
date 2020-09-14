import React, { Component } from 'react';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import { withSnackbar } from 'notistack';
import { removeSnackbar } from '../../redux/snackBarsReducer';
import SnackBarButton from './SnackBarButton';
import SnackBarErrorMessage from './SnackBarErrorMessage';

import MESSAGES from './messages';

let displayed = [];
const saveDisplayedSnackBar = snackBar => {
    displayed = [...displayed, snackBar];
};

class SnackBarContainer extends Component {
    componentDidUpdate() {
        const { notifications = [], dispatch } = this.props;
        notifications.forEach(notification => {
            // Do nothing if snackbar is already displayed
            if (displayed.find(s => s.key === notification.key)) return;

            this.displaySnackBars(notification);
            if (!notification.options.persist) {
                // Dispatch action to remove snackbar from redux store)
                dispatch(removeSnackbar(notification.key));
            }
        });
        this.closePersistingSnackBars();
    }

    displaySnackBars(notification) {
        const options = {
            ...notification.options,
        };

        const {
            intl: { formatMessage },
        } = this.props;
        if (notification.buttonMessageKey && notification.buttonAction) {
            options.action = (
                <SnackBarButton
                    messageKey={notification.buttonMessageKey}
                    onClick={() => notification.buttonAction()}
                />
            );
        }
        // Display snackbar using notistack
        const message = notification.messageObject
            ? formatMessage(notification.messageObject)
            : formatMessage(MESSAGES[notification.messageKey]);

        if (notification.errorLog) {
            options.action = (
                <SnackBarErrorMessage
                    errorLog={notification.errorLog}
                    id={notification.id}
                />
            );
        }
        const id = this.props.enqueueSnackbar(message, options);

        // Keep track of snackbars that we've displayed
        saveDisplayedSnackBar({
            key: notification.key,
            message,
            options,
            id,
        });
    }

    closePersistingSnackBars() {
        // close persisting notifications if not in the store anymore
        const { notifications = [] } = this.props;
        displayed.forEach(displayedNotification => {
            if (
                displayedNotification.options.persist &&
                !notifications.find(n => n.key === displayedNotification.key)
            ) {
                this.props.closeSnackbar(displayedNotification.id);
            }
        });
    }

    render() {
        return null;
    }
}

SnackBarContainer.propTypes = {
    notifications: PropTypes.array.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    notifications: state.snackBar ? state.snackBar.notifications : [],
});

export default connect(MapStateToProps)(
    withSnackbar(injectIntl(SnackBarContainer)),
);
