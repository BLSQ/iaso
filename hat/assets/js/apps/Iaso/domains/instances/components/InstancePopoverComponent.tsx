import React from 'react';
import moment from 'moment';

import { makeStyles } from '@mui/styles';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';
import Info from '@mui/icons-material/InfoOutlined';

// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';

import { getOrgUnitsTree } from '../../orgUnits/utils';

const useStyles = makeStyles(theme => ({
    popoverPaper: {
        width: 430,
    },
    button: {
        color: 'white',
    },
    buttonIcon: {
        marginLeft: theme.spacing(1),
    },
    typography: {
        padding: theme.spacing(2),
    },
}));

type Props = {
    instanceDetail?: any;
};

const InstancePopover: React.FunctionComponent<Props> = ({
    instanceDetail = null,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = React.useState(null);
    if (!instanceDetail) return null;

    const handleClick = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    let orgUnitTree: any[] = [];
    if (instanceDetail && instanceDetail.org_unit) {
        orgUnitTree = getOrgUnitsTree(instanceDetail.org_unit);
        orgUnitTree = orgUnitTree.reverse();
    }
    return (
        <div>
            <Button
                className={classes.button}
                aria-describedby={id}
                onClick={handleClick}
            >
                {`${
                    instanceDetail.org_unit
                        ? `${instanceDetail.org_unit.name} - `
                        : ''
                }${moment.unix(instanceDetail.created_at).format('LTS')}`}
                <Info className={classes.buttonIcon} />
            </Button>
            <Popover
                classes={{
                    paper: classes.popoverPaper,
                }}
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <Box className={classes.typography}>
                    <PopupItemComponent
                        label="Uuid"
                        value={instanceDetail.uuid}
                    />
                    {orgUnitTree.map(o => (
                        <PopupItemComponent
                            key={o.id}
                            label={o.org_unit_type_name}
                            value={o ? o.name : null}
                        />
                    ))}
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.device)}
                        value={instanceDetail.device_id}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.latitude)}
                        value={
                            instanceDetail.latitude
                                ? instanceDetail.latitude.toFixed(5)
                                : '--'
                        }
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.longitude)}
                        value={
                            instanceDetail.longitude
                                ? instanceDetail.longitude.toFixed(5)
                                : '--'
                        }
                    />
                </Box>
            </Popover>
        </div>
    );
};

export default InstancePopover;
