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
    SetStateAction,
    useEffect,
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
    anchorEl: React.RefObject<HTMLElement>;
};

export const SettingsPopper: FunctionComponent<Props> = ({
    settings,
    setSettings,
    anchorEl,
}) => {
    const [open, setOpen] = useState(false);
    const [anchorElement, setAnchorElement] = useState(null);

    useEffect(() => {
        setAnchorElement(anchorEl.current);
    }, [anchorEl.current]);
    const { formatMessage } = useSafeIntl();
    const handleClick = () => {
        setOpen(!open);
    };
    const handleChangeSettings = (setting: string) => {
        setSettings({
            ...settings,
            [setting]: !settings[setting],
        });
    };
    return (
        <Box>
            <IconButton onClick={handleClick}>
                <SettingsIcon color="primary" />
            </IconButton>
            <Popper
                sx={styles.popper}
                open={open}
                anchorEl={anchorElement}
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
            </Popper>
        </Box>
    );
};
