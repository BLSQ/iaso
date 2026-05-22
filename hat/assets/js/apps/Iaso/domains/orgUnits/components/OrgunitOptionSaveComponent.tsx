import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import { OrgUnit } from '../types/orgUnit';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));

type Props = {
    orgUnit: OrgUnit;
    resetOrgUnit: () => void;
    saveDisabled: boolean;
    saveOrgUnit: () => void;
};
const OrgunitOptionSaveComponent: FunctionComponent<Props> = ({
    saveDisabled,
    resetOrgUnit,
    saveOrgUnit,
}) => {
    const classes: Record<string, string> = useStyles();
    return (
        <>
            <Box mb={2}>
                <Button
                    className={classes.button}
                    disabled={saveDisabled}
                    variant="contained"
                    onClick={() => {
                        resetOrgUnit();
                    }}
                >
                    <FormattedMessage {...MESSAGES.cancel} />
                </Button>
            </Box>
            <Button
                disabled={saveDisabled}
                variant="contained"
                className={classes.button}
                color="primary"
                onClick={() => saveOrgUnit()}
            >
                <FormattedMessage {...MESSAGES.save} />
            </Button>
        </>
    );
};

export default OrgunitOptionSaveComponent;
