import React, { FunctionComponent, useState, useCallback } from 'react';
import { InView } from 'react-intersection-observer';
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
} from '@material-ui/core';
import Close from '@material-ui/icons/Close';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ViewColumnIcon from '@material-ui/icons/ViewColumn';

import { BlockPlaceholder, useSafeIntl } from 'bluesquare-components';

import { MESSAGES } from './messages';
import { ColumnDrawerSwitch } from './ColumnDrawerSwitch';

import { useStyles } from './styles';

type Option = {
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
    setOptions: React.Dispatch<React.SetStateAction<Option[]>>;
    minColumns?: number;
    disabled: boolean;
    disabledMessage?: string;
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
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchString, setSearchString] = useState<string>('');

    const toggleDrawer = open => () => {
        setIsOpen(open);
    };

    const handleSearch =
        (reset = false) =>
        event => {
            setSearchString(reset ? '' : event.target.value);
        };

    const handleChangeOptions = useCallback(
        index => event => {
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
    return (
        <>
            {disabled && disabledMessage && (
                <Tooltip arrow title={disabledMessage}>
                    <Box>
                        <Button
                            disabled
                            variant="contained"
                            color="primary"
                            onClick={toggleDrawer(true)}
                            id="ColumnsSelectDrawer-toggleDrawer"
                        >
                            <Box mr={1} display="inline-flex">
                                <ViewColumnIcon />
                            </Box>
                            {formatMessage(MESSAGES.columnSelect)}
                        </Button>
                    </Box>
                </Tooltip>
            )}
            {(!disabled || (disabled && !disabledMessage)) && (
                <Button
                    disabled={disabled}
                    variant="contained"
                    color="primary"
                    onClick={toggleDrawer(true)}
                    id="ColumnsSelectDrawer-toggleDrawer"
                >
                    <Box mr={1} display="inline-flex">
                        <ViewColumnIcon />
                    </Box>
                    {formatMessage(MESSAGES.columnSelect)}
                </Button>
            )}
            <Drawer anchor="right" open={isOpen} onClose={toggleDrawer(false)}>
                <div className={classes.root}>
                    <div className={classes.toolbar}>
                        <Tooltip title={formatMessage(MESSAGES.close)}>
                            <IconButton onClick={toggleDrawer(false)}>
                                <ArrowBack />
                            </IconButton>
                        </Tooltip>
                        <div className={classes.search}>
                            <InputBase
                                value={searchString}
                                onChange={handleSearch()}
                                className={classes.input}
                                placeholder={formatMessage(MESSAGES.search)}
                                inputProps={{
                                    'aria-label': formatMessage(
                                        MESSAGES.search,
                                    ),
                                    className: classes.input,
                                    id: 'ColumnsSelectDrawer-search',
                                }}
                            />
                        </div>
                        {searchString !== '' && (
                            <Tooltip
                                title={formatMessage(MESSAGES.resetSearch)}
                            >
                                <IconButton
                                    onClick={handleSearch(true)}
                                    id="ColumnsSelectDrawer-search-empty"
                                >
                                    <Close />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    <Divider />
                    <div className={classes.list} id="ColumnsSelectDrawer-list">
                        <List>
                            {displayedOptions.map(o => (
                                <InView key={o.key}>
                                    {({ inView, ref }) => (
                                        <div ref={ref} id={o.key}>
                                            <ListItem
                                                className={classes.listItem}
                                            >
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
                                                        className={
                                                            classes.switch
                                                        }
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
                                        </div>
                                    )}
                                </InView>
                            ))}
                        </List>
                    </div>
                </div>
            </Drawer>
        </>
    );
};
