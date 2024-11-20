import React from 'react';
import { injectIntl, IntlFormatMessage } from 'bluesquare-components';
import { Typography, Box } from '@mui/material';
import { withStyles } from '@mui/styles';

import MESSAGES from '../messages';
import { UserLogValue } from './UserLogValue';

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
    fieldKey: string;
    value?: string | number | Array<string> | Array<number> | boolean;
    intl: { formatMessage: IntlFormatMessage };
    classes: Record<string, string>;
    isDifferent: boolean;
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
            isDifferent,
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
        return (
            <UserLogValue
                fieldKey={fieldKey}
                value={value}
                isDifferent={isDifferent}
            />
        );
    }
}

export const UserLogValueWithErrorBoundary = withStyles(styles)(
    injectIntl(ValueWithErrorBoundary),
);
