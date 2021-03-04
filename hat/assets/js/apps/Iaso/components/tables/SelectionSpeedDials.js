import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import { ClickAwayListener } from '@material-ui/core';
import { SpeedDial, SpeedDialAction } from '@material-ui/lab';

import CheckBoxIcon from '@material-ui/icons/CheckBox';

import MESSAGES from '../../domains/orgUnits/messages';
import injectIntl from '../../libs/intl/injectIntl';

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

const SelectionSpeedDials = ({
    hidden,
    intl: { formatMessage },
    actions,
    selection,
}) => {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpen = () => {
        setOpen(true);
    };
    const activeAction = actions.filter(a => {
        if (typeof a.disabled === 'function') {
            return !a.disabled(selection);
        }
        return !a.disabled;
    });
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
                        onClick={() => action.onClick(selection)}
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
    selection: PropTypes.object.isRequired,
};

export default injectIntl(SelectionSpeedDials);
