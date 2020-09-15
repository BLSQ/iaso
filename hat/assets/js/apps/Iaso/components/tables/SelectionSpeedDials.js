import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import { ClickAwayListener } from '@material-ui/core';
import { SpeedDial, SpeedDialAction } from '@material-ui/lab';

import CheckBoxIcon from '@material-ui/icons/CheckBox';

import MESSAGES from '../../domains/orgUnits/messages';

const useStyles = makeStyles(theme => ({
    speedDial: {
        position: 'absolute',
        '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
            bottom: theme.spacing(2),
            right: theme.spacing(2),
        },
        '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
            top: theme.spacing(2),
            left: theme.spacing(2),
        },
    },
}));

const SelectionSpeedDials = ({ hidden, intl: { formatMessage }, actions }) => {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = () => {
        setOpen(true);
    };
    const activeAction = actions.filter(a => !a.disabled);
    return (
        <ClickAwayListener onClickAway={() => handleClose()}>
            <SpeedDial
                ariaLabel={formatMessage(MESSAGES.selectionAction)}
                className={classes.speedDial}
                hidden={hidden}
                icon={<CheckBoxIcon />}
                onOpen={handleOpen}
                open={open}
                direction="up"
            >
                {activeAction.map(action => (
                    <SpeedDialAction
                        key={action.label}
                        icon={action.icon}
                        tooltipTitle={action.label}
                        onClick={() => action.onClick()}
                    />
                ))}
            </SpeedDial>
        </ClickAwayListener>
    );
};

SelectionSpeedDials.defaultProps = {
    hidden: false,
    actions: [],
};

SelectionSpeedDials.propTypes = {
    hidden: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    actions: PropTypes.array,
};

export default injectIntl(SelectionSpeedDials);
