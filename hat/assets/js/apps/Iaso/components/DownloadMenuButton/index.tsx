import React, { FunctionComponent, useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import IconButton from '@mui/material/IconButton/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import Typography from '@mui/material/Typography/Typography';
import { useSafeIntl } from 'bluesquare-components';
import {
    DownloadState,
    useDownloadWithProgress,
} from '../../hooks/useDownloadWithProgress';
import MESSAGES from './messages';
import { DownloadOption } from './types';

export { useDownloadOption } from './hooks/useDownloadOption';
export type { DownloadFormat, DownloadOption } from './types';

type Props = {
    options: DownloadOption[];
    disabled?: boolean;
    /** Toggle rendering: the labelled button (default) or a small round icon. */
    buttonType?: 'button' | 'icon';
};

const getPercent = ({ loadedBytes, totalBytes }: DownloadState) =>
    totalBytes
        ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
        : undefined;

const DownloadStatusText: FunctionComponent<{ state: DownloadState }> = ({
    state,
}) => {
    const { formatMessage } = useSafeIntl();
    if (state.status === 'idle') return null;
    const percent = getPercent(state);
    let text: string;
    if (state.status === 'preparing') {
        text = formatMessage(MESSAGES.preparing);
    } else if (percent !== undefined) {
        text = formatMessage(MESSAGES.downloadingPercent, { percent });
    } else {
        text = formatMessage(MESSAGES.downloadingSize, {
            size: (state.loadedBytes / 1024 / 1024).toFixed(1),
        });
    }
    return (
        <Typography variant="body2" color="textSecondary" role="status" mr={2}>
            {text}
        </Typography>
    );
};

/**
 * A "Download" button opening the list of the available formats. The file is downloaded through fetch: the
 * button is disabled during the download (the server can take a while to prepare big exports) and the progress
 * is shown on its left (so that the button, usually aligned on the right, doesn't move).
 */
export const DownloadMenuButton: FunctionComponent<Props> = ({
    options,
    disabled = false,
    buttonType = 'button',
}) => {
    const { formatMessage } = useSafeIntl();
    const { download, state } = useDownloadWithProgress();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const isDownloading = state.status !== 'idle';
    const percent =
        state.status === 'downloading' ? getPercent(state) : undefined;

    const spinner = (
        <CircularProgress
            size={20}
            variant={percent === undefined ? 'indeterminate' : 'determinate'}
            value={percent}
        />
    );
    return (
        <Box data-test="download-menu" display="flex" alignItems="center">
            <DownloadStatusText state={state} />
            {buttonType === 'icon' ? (
                <Tooltip title={formatMessage(MESSAGES.export)}>
                    <span>
                        <IconButton
                            data-test="download-menu-button"
                            color="primary"
                            size="small"
                            disabled={disabled || isDownloading}
                            onClick={event => setAnchor(event.currentTarget)}
                            aria-haspopup="menu"
                            aria-expanded={Boolean(anchor)}
                            aria-label={formatMessage(MESSAGES.export)}
                        >
                            {isDownloading ? (
                                spinner
                            ) : (
                                <FileDownloadIcon fontSize="small" />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            ) : (
                <Button
                    data-test="download-menu-button"
                    variant="outlined"
                    color="primary"
                    disabled={disabled || isDownloading}
                    onClick={event => setAnchor(event.currentTarget)}
                    aria-haspopup="menu"
                    aria-expanded={Boolean(anchor)}
                    startIcon={isDownloading ? spinner : <FileDownloadIcon />}
                    endIcon={<ArrowDropDownIcon />}
                >
                    {formatMessage(MESSAGES.download)}
                </Button>
            )}
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {options.map(option => (
                    <MenuItem
                        key={option.key}
                        data-test={`download-option-${option.key}`}
                        onClick={() => {
                            setAnchor(null);
                            download(
                                option.url,
                                option.key,
                                `export.${option.extension ?? option.key}`,
                            );
                        }}
                    >
                        {option.icon && (
                            <ListItemIcon>{option.icon}</ListItemIcon>
                        )}
                        <ListItemText>
                            {formatMessage(MESSAGES.exportFormat, {
                                format: option.label,
                            })}
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};
