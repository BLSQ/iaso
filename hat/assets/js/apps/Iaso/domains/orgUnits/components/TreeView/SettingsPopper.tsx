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
import { OrgUnitStatus } from '../../types/orgUnit';
import { MESSAGES } from './messages';

export type Settings = {
    displayTypes: boolean;
    statusSettings: OrgUnitStatus[];
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
const POSSIBLE_ORG_UNIT_STATUSES: OrgUnitStatus[] = [
    'VALID',
    'REJECTED',
    'NEW',
];

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

    const handleChangeTypes = useCallback(() => {
        setSettings(prevSettings => ({
            ...prevSettings,
            displayTypes: !prevSettings.displayTypes,
        }));
    }, [setSettings]);

    const handleChangeVisibleStatus = useCallback(
        (status: OrgUnitStatus) => {
            setSettings(prevSettings => {
                const currentStatuses = prevSettings.statusSettings;
                const statusIndex = currentStatuses.indexOf(status);
                if (statusIndex === -1) {
                    // Status not in array, add it
                    return {
                        ...prevSettings,
                        statusSettings: [...currentStatuses, status],
                    };
                }
                // Status in array, remove it
                return {
                    ...prevSettings,
                    statusSettings: currentStatuses.filter(s => s !== status),
                };
            });
        },
        [setSettings],
    );

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

                <ClickAwayListener
                    onClickAway={() => {
                        setAnchorEl(null);
                    }}
                >
                    <Paper sx={styles.paper} elevation={1}>
                        <Box py={0.5}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={settings.displayTypes}
                                        onChange={handleChangeTypes}
                                        color="primary"
                                    />
                                }
                                label={formatMessage(MESSAGES.displayTypes)}
                            />
                        </Box>
                        {POSSIBLE_ORG_UNIT_STATUSES.map(status => (
                            <Box py={0.5} key={status}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={settings.statusSettings.includes(
                                                status,
                                            )}
                                            onChange={() =>
                                                handleChangeVisibleStatus(
                                                    status,
                                                )
                                            }
                                            color="primary"
                                        />
                                    }
                                    label={formatMessage(
                                        MESSAGES[`display${status}`],
                                    )}
                                />
                            </Box>
                        ))}
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </Box>
    );
};
