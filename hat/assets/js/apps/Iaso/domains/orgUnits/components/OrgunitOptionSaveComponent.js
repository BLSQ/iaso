import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import { withStyles, Button } from '@material-ui/core';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

function OrgunitOptionSaveComponent(props) {
    const { saveDisabled, classes, resetOrgUnit, saveOrgUnit } = props;
    return (
        <>
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
}

OrgunitOptionSaveComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    resetOrgUnit: PropTypes.func.isRequired,
    saveDisabled: PropTypes.bool.isRequired,
    saveOrgUnit: PropTypes.func.isRequired,
};

export default withStyles(styles)(OrgunitOptionSaveComponent);
