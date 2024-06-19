import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';
import { Typography, Box } from '@mui/material';
import { withStyles } from '@mui/styles';

import { LogValue } from './LogValue.tsx';
import MESSAGES from './messages';

const styles = theme => ({
    errorContainer: {
        backgroundColor: theme.palette.error.background,
        padding: theme.spacing(2),
        margin: theme.spacing(-2),
    },
    title: {
        fontSize: 1,
        fontWeight: 'bold',
    },
});

// Use an errorBoundary so if the value cannot be parsed and crash when rendering
// we still display the raw value
class ValueWithErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        console.error(error);
        return { hasError: true, error };
    }

    render() {
        const {
            fieldKey,
            value,
            intl: { formatMessage },
            classes,
        } = this.props;
        if (this.state.hasError) {
            return (
                <Box className={classes.errorContainer}>
                    <Typography variant="h6" className={classes.title}>
                        {formatMessage(MESSAGES.renderError)}:
                    </Typography>
                    <pre>{`${value}`}</pre>
                </Box>
            );
        }
        return <LogValue fieldKey={fieldKey} value={value} />;
    }
}
ValueWithErrorBoundary.defaultProps = {
    value: undefined,
};
ValueWithErrorBoundary.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fieldKey: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(ValueWithErrorBoundary));
