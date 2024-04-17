import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    Box,
    FormControlLabel,
    IconButton,
    Paper,
    Popper,
    Switch,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, {
    Dispatch,
    FunctionComponent,
    MouseEvent,
    SetStateAction,
    useState,
} from 'react';
import { SxStyles } from '../../../../types/general';
import { MESSAGES } from './messages';

export type Settings = {
    displayTypes: boolean;
    displayRejected: boolean;
    displayNew: boolean;
};

const styles: SxStyles = {
    popper: {
        zIndex: 1300,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 5,
        zIndex: 1301,
    },
    paper: {
        padding: theme => theme.spacing(1, 3, 2, 2),
        position: 'relative',
    },
};

type Props = {
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
};

export const SettingsPopper: FunctionComponent<Props> = ({
    settings,
    setSettings,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const { formatMessage } = useSafeIntl();
    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const handleChangeSettings = (setting: string) => {
        setSettings({
            ...settings,
            [setting]: !settings[setting],
        });
    };
    const open = Boolean(anchorEl);
    return (
        <Box>
            <IconButton onClick={handleClick}>
                <SettingsIcon color="primary" />
            </IconButton>
            <Popper
                sx={styles.popper}
                open={open}
                anchorEl={anchorEl}
                placement="right"
            >
                <IconButton
                    size="small"
                    onClick={handleClick}
                    sx={styles.closeButton}
                >
                    <CancelOutlinedIcon color="primary" fontSize="small" />
                </IconButton>
                <Paper sx={styles.paper} elevation={1}>
                    {['displayTypes', 'displayRejected', 'displayNew'].map(
                        setting => (
                            <Box key={setting} py={0.5}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={settings[setting]}
                                            onChange={() =>
                                                handleChangeSettings(setting)
                                            }
                                            color="primary"
                                        />
                                    }
                                    label={formatMessage(MESSAGES[setting])}
                                />
                            </Box>
                        ),
                    )}
                </Paper>
            </Popper>
        </Box>
    );
};
