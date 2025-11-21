import React, { FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import EditIcon from '@mui/icons-material/Settings';
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    speedDial: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    fab: {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
    },
}));

type Props = {
    actions: any[];
    onActionSelected: (action: any) => void;
    speedDialClasses?: string;
};

const SpeedDialInstanceActions: FunctionComponent<Props> = ({
    onActionSelected,
    speedDialClasses = '',
    actions,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
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
                className={classnames(classes.speedDial, speedDialClasses)}
                icon={<EditIcon />}
                onClose={handleClose}
                onOpen={handleOpen}
                open={open}
                direction="up"
                FabProps={{ className: classes.fab }}
            >
                {actions.map(action => (
                    <SpeedDialAction
                        key={action.id}
                        tooltipPlacement="bottom"
                        icon={action.icon}
                        tooltipTitle={formatMessage(MESSAGES[action.id])}
                        disabled={action.disabled ?? false}
                        onClick={() => handleClick(action)}
                    />
                ))}
            </SpeedDial>
        </div>
    );
};

export default SpeedDialInstanceActions;
