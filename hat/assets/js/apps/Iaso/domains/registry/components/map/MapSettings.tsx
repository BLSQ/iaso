import Settings from '@mui/icons-material/Settings';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useState } from 'react';

import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';

const styles: SxStyles = {
    root: {
        position: 'absolute',
        zIndex: 1101,
        borderRadius: 0,
        boxShadow: 'none',
        minHeight: 34,
        minWidth: 34,
        top: 164,
        backgroundColor: 'transparent',
        left: 10,
    },
    iconContainer: {
        position: 'absolute',
        top: '4px',
        left: '190px',
        backgroundColor: 'white',
    },
    barButton: {
        display: 'flex',
        position: 'absolute',
        cursor: 'pointer',
        top: '2px',
        right: 0,
        minHeight: 34,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 34,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        borderLeft: '2px solid rgba(0,0,0,0.2)',
        borderRight: '2px solid rgba(0,0,0,0.2)',
        borderBottom: '2px solid rgba(0,0,0,0.2)',
        // color: theme => `${theme.textColor}`,
    },
    button: {
        display: 'flex',
        minHeight: 32,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 30,
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        '&:hover': {
            backgroundColor: '#f4f4f4',
        },
    },
    container: {
        position: 'relative',
        transition: 'width .1s ease-in-out, height .3s ease-in-out',
        overflow: 'hidden',
    },
    tooltip: {
        backgroundColor: 'white',
        width: 233,
        height: 90,
    },
    open: {
        width: 237,
        height: 94,
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: '4px',
        transition: 'width .1s ease-in-out, height .3s ease-in-out',
    },
    closed: {
        width: 0,
        height: 0,
        transition: 'width .1s ease-in-out, height .3s ease-in-out',
    },
};
export type Settings = {
    showTooltip: boolean;
    clusterEnabled: boolean;
};

type Props = {
    settings: Settings;
    handleChangeSettings: (key: string) => void;
};

export const MapSettings: FunctionComponent<Props> = ({
    settings,
    handleChangeSettings,
}) => {
    const { formatMessage } = useSafeIntl();
    const [tilePopup, setTilePopup] = useState<boolean>(false);

    const toggleTilePopup = () => {
        setTilePopup(!tilePopup);
    };
    return (
        <Box sx={styles.root}>
            {!tilePopup && (
                <Box
                    sx={styles.barButton}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTilePopup()}
                >
                    <Box sx={styles.button}>
                        <Settings fontSize="small" />
                    </Box>
                </Box>
            )}

            <Box
                sx={{
                    ...styles.container,
                    ...((tilePopup ? styles.open : styles.closed) as SxStyles),
                }}
            >
                {tilePopup && (
                    <Box sx={styles.tooltip}>
                        <Box sx={styles.iconContainer}>
                            <IconButton
                                size="small"
                                onClick={() => toggleTilePopup()}
                                icon="clear"
                                tooltipMessage={MESSAGES.close}
                            />
                        </Box>
                        <Box px={3} pt="20px">
                            <FormControlLabel
                                label={formatMessage(MESSAGES.showNames)}
                                control={
                                    <Switch
                                        size="small"
                                        checked={settings.showTooltip}
                                        onChange={() =>
                                            handleChangeSettings('showTooltip')
                                        }
                                        color="primary"
                                    />
                                }
                            />
                        </Box>
                        <Box px={3} pt={1}>
                            <FormControlLabel
                                label={formatMessage(MESSAGES.markerClustering)}
                                control={
                                    <Switch
                                        size="small"
                                        checked={settings.clusterEnabled}
                                        onChange={() =>
                                            handleChangeSettings(
                                                'clusterEnabled',
                                            )
                                        }
                                        color="primary"
                                    />
                                }
                            />
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
