import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    Box,
    ClickAwayListener,
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
    useCallback,
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

const settingKeys: string[] = ['displayTypes', 'displayRejected', 'displayNew'];

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
    const handleClick = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            setAnchorEl(anchorEl ? null : event.currentTarget);
        },
        [anchorEl],
    );

    const handleChangeSettings = useCallback(
        (setting: string) => {
            setSettings(prevSettings => ({
                ...prevSettings,
                [setting]: !prevSettings[setting],
            }));
        },
        [setSettings],
    );

    const handleClickAway = useCallback(() => {
        setAnchorEl(null);
    }, []);
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

                <ClickAwayListener onClickAway={handleClickAway}>
                    <Paper sx={styles.paper} elevation={1}>
                        {settingKeys.map(settingKey => (
                            <Box key={settingKey} py={0.5}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={settings[settingKey]}
                                            onChange={() =>
                                                handleChangeSettings(settingKey)
                                            }
                                            color="primary"
                                        />
                                    }
                                    label={formatMessage(MESSAGES[settingKey])}
                                />
                            </Box>
                        ))}
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </Box>
    );
};
