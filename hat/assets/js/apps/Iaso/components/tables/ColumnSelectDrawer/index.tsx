import React, { FunctionComponent, useState, useCallback } from 'react';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Close from '@mui/icons-material/Close';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
    Drawer,
    IconButton,
    List,
    ListItem,
    Divider,
    InputBase,
    Tooltip,
    Button,
    Box,
    Typography,
} from '@mui/material';

import { BlockPlaceholder, useSafeIntl } from 'bluesquare-components';
import { InView } from 'react-intersection-observer';

import { ColumnDrawerSwitch } from './ColumnDrawerSwitch';
import { MESSAGES } from './messages';

import { styles } from './styles';

export type Option = {
    active: boolean;
    disabled: boolean;
    key: string;
    label: string;
    index?: number;
};

type TooltipProps = {
    option: Option;
};

const TooltipTitle: FunctionComponent<TooltipProps> = ({ option }) => {
    return (
        <Box>
            {option.label ? (
                <>
                    {option.label} -<br />
                </>
            ) : (
                ''
            )}{' '}
            -{option.key}
        </Box>
    );
};
type Props = {
    options: Option[];
    setOptions:
        | React.Dispatch<React.SetStateAction<Option[]>>
        | ((options: Option[]) => void);
    minColumns?: number;
    disabled: boolean;
    disabledMessage?: string;
    handleApplyOptions?: () => void;
    isDisabled?: boolean;
    buttonType?: 'button' | 'icon';
};

const filterResults = (searchString: string, options: Option[]): Option[] => {
    let displayedOptions = [...options];
    displayedOptions = displayedOptions.map((o, i) => ({ ...o, index: i }));
    if (searchString !== '') {
        const search = searchString.toLowerCase();
        displayedOptions = displayedOptions.filter(
            o =>
                o?.key?.toLowerCase().includes(search) ||
                o?.label?.toLowerCase().includes(search),
        );
    }
    return displayedOptions;
};

export const ColumnsSelectDrawer: FunctionComponent<Props> = ({
    options,
    setOptions,
    minColumns = 2,
    disabled,
    disabledMessage,
    handleApplyOptions,
    isDisabled,
    buttonType = 'button',
}) => {
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchString, setSearchString] = useState<string>('');

    const toggleDrawer = (open: boolean) => () => {
        setIsOpen(open);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchString(event.target.value);
    };

    const handleSearchReset = () => {
        setSearchString('');
    };

    const handleApply = () => {
        handleApplyOptions?.();
        setIsOpen(false);
        setSearchString('');
    };

    const handleChangeOptions = useCallback(
        (index?: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
            if (index === undefined) return;
            const newOptions = [...options];
            newOptions[index] = {
                ...newOptions[index],
                active: event.target.checked,
            };
            setOptions(newOptions);
        },
        [options, setOptions],
    );

    const activeOptionsCount = options.filter(o => o.active).length;

    const displayedOptions = filterResults(searchString, options);
    // Previous labelled button by default, small round icon on request.
    const renderToggle = (toggleDisabled: boolean, contained: boolean) =>
        buttonType === 'icon' ? (
            <IconButton
                disabled={toggleDisabled}
                color="primary"
                size="small"
                onClick={toggleDrawer(true)}
                id="ColumnsSelectDrawer-toggleDrawer"
                aria-label={formatMessage(MESSAGES.columnSelect)}
            >
                <ViewColumnIcon fontSize="small" />
            </IconButton>
        ) : (
            <Button
                disabled={toggleDisabled}
                variant={contained ? 'contained' : 'outlined'}
                color="primary"
                onClick={toggleDrawer(true)}
                id="ColumnsSelectDrawer-toggleDrawer"
            >
                <Box mr={1} display="inline-flex">
                    <ViewColumnIcon />
                </Box>
                {formatMessage(MESSAGES.columnSelect)}
            </Button>
        );
    return (
        <>
            {disabled && disabledMessage && (
                <Tooltip arrow title={disabledMessage}>
                    <Box>{renderToggle(true, true)}</Box>
                </Tooltip>
            )}
            {(!disabled || (disabled && !disabledMessage)) &&
                (buttonType === 'icon' ? (
                    <Tooltip arrow title={formatMessage(MESSAGES.columnSelect)}>
                        <span>{renderToggle(disabled, false)}</span>
                    </Tooltip>
                ) : (
                    renderToggle(disabled, false)
                ))}
            <Drawer anchor="right" open={isOpen} onClose={toggleDrawer(false)}>
                <Box sx={styles.root} role="presentation">
                    <Box sx={styles.header}>
                        <Tooltip title={formatMessage(MESSAGES.close)}>
                            <IconButton
                                onClick={toggleDrawer(false)}
                                aria-label={
                                    formatMessage(MESSAGES.close) as string
                                }
                            >
                                <ArrowBack />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="h6">
                            {formatMessage(MESSAGES.title)}
                        </Typography>
                    </Box>
                    <Divider />
                    <Box sx={styles.content} id="ColumnsSelectDrawer-list">
                        <Box sx={styles.search}>
                            <InputBase
                                value={searchString}
                                onChange={handleSearchChange}
                                sx={styles.input}
                                placeholder={formatMessage(MESSAGES.search)}
                                inputProps={{
                                    'aria-label': formatMessage(
                                        MESSAGES.search,
                                    ),
                                    id: 'ColumnsSelectDrawer-search',
                                }}
                            />
                            {searchString !== '' && (
                                <Tooltip
                                    title={formatMessage(MESSAGES.resetSearch)}
                                >
                                    <IconButton
                                        onClick={handleSearchReset}
                                        id="ColumnsSelectDrawer-search-empty"
                                        size="small"
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        <List disablePadding>
                            {displayedOptions.map(o => (
                                <InView key={o.key}>
                                    {({ inView, ref }) => (
                                        <Box ref={ref} id={o.key}>
                                            <ListItem sx={styles.listItem}>
                                                {inView && (
                                                    <ColumnDrawerSwitch
                                                        disabled={
                                                            activeOptionsCount ===
                                                                minColumns &&
                                                            o.active
                                                        }
                                                        checked={o.active}
                                                        onChange={handleChangeOptions(
                                                            o.index,
                                                        )}
                                                        sx={styles.switch}
                                                        toolTipTitle={
                                                            <TooltipTitle
                                                                option={o}
                                                            />
                                                        }
                                                        primaryText={
                                                            o.label
                                                                ? o.label
                                                                : o.key
                                                        }
                                                        secondaryText={o.key}
                                                    />
                                                )}
                                                {!inView && (
                                                    <>
                                                        <BlockPlaceholder width="30px" />
                                                        <BlockPlaceholder />
                                                    </>
                                                )}
                                            </ListItem>
                                        </Box>
                                    )}
                                </InView>
                            ))}
                        </List>
                    </Box>
                    {handleApplyOptions && (
                        <>
                            <Divider />
                            <Box sx={styles.footer}>
                                <Button
                                    onClick={handleSearchReset}
                                    data-test="columns-clear"
                                >
                                    {formatMessage(MESSAGES.clear)}
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    variant="contained"
                                    color="primary"
                                    disabled={isDisabled}
                                    data-test="columns-apply"
                                >
                                    {formatMessage(MESSAGES.apply)}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Drawer>
        </>
    );
};
