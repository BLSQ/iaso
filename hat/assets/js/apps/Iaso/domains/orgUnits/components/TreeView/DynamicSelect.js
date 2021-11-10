import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    ClickAwayListener,
    Divider,
    Button,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import {
    rawTheme,
    LoadingSpinner,
    SearchInput,
    useSafeIntl,
} from 'bluesquare-components';
import { MESSAGES } from './messages';
import { useTreeviewSearch } from './requests';
import { TreeViewResultsCountSelect } from './TreeViewResultsCountSelect';

const styles = theme => ({
    root: {
        height: theme.spacing(9),
        overflow: 'visible',
    },
    container: {
        position: 'relative',
        zIndex: 1000,
    },
    loadingContainer: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        zIndex: 10,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    listContainer: {
        border: `1px solid ${theme.palette.ligthGray.border}`,
        backgroundColor: 'white',
        borderBottomLeftRadius: theme.shape.borderRadius,
        borderBottomRightRadius: theme.shape.borderRadius,
        boxShadow: '0px 9px 29px -5px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
    },
    list: {
        maxHeight: '50vh',
        overflow: 'auto',
    },
    noResult: {
        backgroundColor: 'white',
        border: `1px solid ${theme.palette.ligthGray.border}`,
        borderBottomLeftRadius: theme.shape.borderRadius,
        borderBottomRightRadius: theme.shape.borderRadius,
        color: theme.palette.error.main,
        height: theme.spacing(9),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 9px 29px -5px rgba(0,0,0,0.3)',
    },
    resultInfos: {
        fontSize: 12,
        height: theme.spacing(6),
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: theme.spacing(0, 4),
    },
    countContainer: {
        marginTop: '7px',
    },
    iconButton: {
        height: 25,
        marginLeft: theme.spacing(1),
    },
    resultsCountInput: {
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
        },
        '-moz-appearance': 'textfield',
        textAlign: 'center',
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
    },
    searchButton: {
        marginLeft: '10px',
    },
});

const DynamicSelect = ({
    classes,
    onSelect,
    minResultCount,
    inputLabelObject,
    withSearchButton,
    request,
    makeDropDownText,
    toolTip,
}) => {
    const { formatMessage } = useSafeIntl();
    const [searchValue, setSearchValue] = useState('');
    const [resultsCount, setResultsCount] = useState(minResultCount);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchSent, setSearchSent] = useState(false);
    const [selectCountIsFocused, setSelectCountIsFocused] = useState(false);
    const {
        data: searchResults,
        isLoading,
        isFetching,
    } = useTreeviewSearch(
        request,
        searchValue,
        resultsCount,
        isSearchActive && searchSent,
    );
    const onChangeSearch = newSearchValue => {
        setSearchValue(newSearchValue);
        setSearchSent(false);
    };
    const handleSearch = useCallback(() => {
        if (searchValue !== '') {
            setSearchSent(true);
        }
    }, [searchValue]);

    const handleSelect = element => {
        onSelect(element);
        setIsSearchActive(false);
    };
    const handleResultCountChange = newResultCount => {
        setResultsCount(parseInt(newResultCount, 10));
    };

    const tooltipIcon = (
        <InfoOutlinedIcon
            fontSize="small"
            style={{
                color: rawTheme.palette.mediumGray.main,
            }}
        />
    );

    return (
        <Box className={classes.root}>
            <ClickAwayListener
                onClickAway={() => {
                    if (!selectCountIsFocused) {
                        setIsSearchActive(false);
                    }
                }}
            >
                <Box
                    className={classes.container}
                    onFocus={() => setIsSearchActive(true)}
                >
                    <Box className={classes.searchBar}>
                        <SearchInput
                            disabled={isLoading}
                            keyValue="orgUnitSearch"
                            onChange={value => {
                                onChangeSearch(value);
                            }}
                            value={searchValue}
                            type="search"
                            label={formatMessage(inputLabelObject)}
                            onEnterPressed={() => handleSearch()}
                        />
                        {withSearchButton && (
                            <Button
                                variant="contained"
                                className={classes.searchButton}
                                color="primary"
                                onClick={handleSearch}
                            >
                                <FormattedMessage {...MESSAGES.search} />
                            </Button>
                        )}
                    </Box>

                    {isLoading && (
                        <div className={classes.loadingContainer}>
                            <LoadingSpinner
                                fixed={false}
                                transparent
                                padding={4}
                                size={25}
                            />
                        </div>
                    )}
                    {searchResults.length === 0 &&
                        isSearchActive &&
                        searchSent &&
                        !isFetching && (
                            <Typography
                                variant="body2"
                                align="center"
                                className={classes.noResult}
                            >
                                <FormattedMessage {...MESSAGES.noOptions} />
                            </Typography>
                        )}
                    {searchResults.length > 0 && isSearchActive && (
                        <Box className={classes.listContainer}>
                            <List className={classes.list}>
                                {searchResults.map(element => (
                                    <ListItem
                                        key={element.id}
                                        button
                                        onClick={() => handleSelect(element)}
                                        className="org-unit-item"
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography type="body2">
                                                    {makeDropDownText(element)}
                                                </Typography>
                                            }
                                        />
                                        {toolTip &&
                                            toolTip(element, tooltipIcon)}
                                    </ListItem>
                                ))}
                            </List>
                            <Divider />
                            <Box className={classes.resultInfos}>
                                <ClickAwayListener
                                    onClickAway={() =>
                                        setSelectCountIsFocused(false)
                                    }
                                >
                                    <div
                                        className={classes.countContainer}
                                        onFocus={() =>
                                            setSelectCountIsFocused(true)
                                        }
                                    >
                                        <TreeViewResultsCountSelect
                                            handleSelect={
                                                handleResultCountChange
                                            }
                                            resultsCount={resultsCount}
                                        />
                                    </div>
                                </ClickAwayListener>
                            </Box>
                        </Box>
                    )}
                </Box>
            </ClickAwayListener>
        </Box>
    );
};

DynamicSelect.defaultProps = {
    minResultCount: 50,
    inputLabelObject: MESSAGES.search,
    withSearchButton: false,
    toolTip: null,
    onSelect: () => {},
};

DynamicSelect.propTypes = {
    classes: PropTypes.object.isRequired,
    onSelect: PropTypes.func,
    minResultCount: PropTypes.number,
    inputLabelObject: PropTypes.object,
    withSearchButton: PropTypes.bool,
    request: PropTypes.func.isRequired,
    makeDropDownText: PropTypes.func.isRequired,
    toolTip: PropTypes.func,
};

const dynamicSelect = withStyles(styles)(DynamicSelect);

export { dynamicSelect as DynamicSelect };
