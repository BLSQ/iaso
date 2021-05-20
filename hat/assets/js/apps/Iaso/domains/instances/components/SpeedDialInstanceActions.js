import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import MESSAGES from '../messages';
import injectIntl from '../../../libs/intl/injectIntl';

const useStyles = makeStyles(theme => ({
    speedDial: {
        position: 'absolute',
        zIndex: 1000000,
        top: theme.spacing(6.5),
        right: theme.spacing(2),
    },
    fab: {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
    },
}));

const SpeedDialInstanceActions = props => {
    const {
        intl: { formatMessage },
        actions,
        onActionSelected,
    } = props;
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const handleClick = action => {
        setOpen(false);
        onActionSelected(action);
    };

    return (
        <div className={classes.root}>
            <SpeedDial
                ariaLabel="Instance actions"
                className={classes.speedDial}
                icon={<EditIcon />}
                onClose={handleClose}
                onOpen={handleOpen}
                open={open}
                direction="left"
                FabProps={{ className: classes.fab }}
            >
                {actions.map(action => (
                    <SpeedDialAction
                        key={action.id}
                        tooltipPlacement="bottom"
                        icon={action.icon}
                        tooltipTitle={formatMessage(MESSAGES[action.id])}
                        disabled={action.disabled}
                        onClick={() => handleClick(action)}
                    />
                ))}
            </SpeedDial>
        </div>
    );
};

SpeedDialInstanceActions.propTypes = {
    intl: PropTypes.object.isRequired,
    actions: PropTypes.array.isRequired,
    onActionSelected: PropTypes.func.isRequired,
};

export default injectIntl(SpeedDialInstanceActions);
