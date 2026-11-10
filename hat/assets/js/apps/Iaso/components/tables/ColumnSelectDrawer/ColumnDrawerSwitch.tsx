import React, {
    ChangeEvent,
    FunctionComponent,
    ReactElement,
    ReactNode,
} from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    Box,
    ListItemText,
    Switch,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { Theme } from '@mui/material';
import { SxProps } from '@mui/system';
import { truncateText } from 'bluesquare-components';

type Props = {
    disabled: boolean;
    onChange?: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    sx: SxProps<Theme>;
    checked: boolean;
    toolTipTitle: string | ReactElement;
    primaryText: string;
    secondaryText: string;
    size?: 'small' | 'medium' | undefined;
    warning?: string | ReactNode;
};

export const ColumnDrawerSwitch: FunctionComponent<Props> = ({
    disabled,
    onChange = () => null,
    sx,
    checked,
    toolTipTitle,
    primaryText,
    secondaryText,
    size = 'small',
    warning,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <>
            <Switch
                disabled={disabled}
                size={size}
                checked={checked}
                onChange={onChange}
                color="primary"
                inputProps={{
                    'aria-label': primaryText,
                    // @ts-ignore
                    'data-test-column-switch': secondaryText,
                }}
                sx={sx}
            />
            <Tooltip
                title={toolTipTitle}
                placement={isMobile ? 'bottom' : 'left-start'}
                slotProps={
                    isMobile
                        ? {}
                        : {
                              popper: {
                                  modifiers: [
                                      {
                                          name: 'offset',
                                          options: {
                                              offset: [0, 40],
                                          },
                                      },
                                  ],
                              },
                          }
                }
            >
                <ListItemText
                    style={{
                        cursor: 'default',
                    }}
                    primary={truncateText(primaryText, 33)}
                    secondary={truncateText(secondaryText, 35)}
                />
            </Tooltip>
            {warning && (
                <Tooltip title={warning} placement="top" arrow>
                    <Box
                        display="inline-flex"
                        color="warning.main"
                        ml={0.5}
                        flexShrink={0}
                        data-test={`column-warning-${secondaryText}`}
                    >
                        <WarningAmberIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
        </>
    );
};
