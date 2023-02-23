import { Button, makeStyles } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import Add from '@material-ui/icons/Add';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({ ...commonStyles(theme) }));

type Props = {
    onClick: () => void;
    disabled: boolean;
};

export const BulkImportButton: FunctionComponent<Props> = ({
    onClick,
    disabled,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            color="primary"
            variant="contained"
            className={classes.button}
        >
            <Add className={classes.buttonIcon} />
            {formatMessage(MESSAGES.createFromFile)}
        </Button>
    );
};
