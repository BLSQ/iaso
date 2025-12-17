import React from 'react';
import { Typography, Box } from '@mui/material';
import { withStyles } from '@mui/styles';
import { injectIntl } from 'bluesquare-components';
import { LogValue } from './LogValue';
import { MESSAGES } from './messages';

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

type Props = {
    value?: string | number | boolean | any[];
    fieldKey: string;
    intl: any;
    classes: Record<string, string>;
};

type State = {
    hasError: boolean;
};

// Use an errorBoundary so if the value cannot be parsed and crash when rendering
// we still display the raw value
class ValueWithErrorBoundary extends React.Component<Props, State> {
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

export default withStyles(styles)(injectIntl(ValueWithErrorBoundary));
