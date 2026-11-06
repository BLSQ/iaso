import React, { ChangeEvent, FC, useCallback } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import IconButton from '@mui/material/IconButton/IconButton';
import InputAdornment from '@mui/material/InputAdornment/InputAdornment';
import Stack from '@mui/material/Stack/Stack';
import TextField from '@mui/material/TextField/TextField';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from './messages';

const styles = {
    search: {
        width: 240,
    },
} satisfies SxStyles;

type Props = {
    search: string;
    onSearchChange: (search: string) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
};

export const TeamTreeToolbar: FC<Props> = ({
    search,
    onSearchChange,
    onExpandAll,
    onCollapseAll,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleSearchChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) =>
            onSearchChange(event.target.value),
        [onSearchChange],
    );
    return (
        <Stack direction="row" alignItems="center" gap={1}>
            <TextField
                size="small"
                value={search}
                onChange={handleSearchChange}
                placeholder={formatMessage(MESSAGES.searchTeamsAndUsers)}
                sx={styles.search}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                }}
            />
            <Tooltip title={formatMessage(MESSAGES.expandAll)}>
                <IconButton
                    onClick={onExpandAll}
                    aria-label={formatMessage(MESSAGES.expandAll)}
                >
                    <UnfoldMoreIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.collapseAll)}>
                <IconButton
                    onClick={onCollapseAll}
                    aria-label={formatMessage(MESSAGES.collapseAll)}
                >
                    <UnfoldLessIcon />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};
