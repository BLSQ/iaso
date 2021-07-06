import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    IconButton,
    ClickAwayListener,
    InputBase,
    Divider,
    Button,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { rawTheme } from 'bluesquare-components';
import LoadingSpinner from '../../../components/LoadingSpinnerComponent';
import InputComponent from '../../../components/forms/InputComponent';
import OrgUnitTooltip from './OrgUnitTooltip';
import { getRequest } from '../../../libs/Api';
import { getOrgunitMessage } from '../utils';
import MESSAGES from '../messages';

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
        border: `1px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme.shape.borderRadius,
        height: theme.spacing(4),
        display: 'flex',
        alignItems: 'center',
        margin: theme.spacing(0, 1),
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

const OrgUnitSearch = ({
    classes,
    onSelectOrgUnit,
    minResultCount,
    inputLabelObject,
    withSearchButton,
}) => {
    const [searchValue, setSearchValue] = useState('');
    const [resultsCount, setResultsCount] = useState(minResultCount);
    const [resultsCountChanged, setResultsCountChanged] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, seIsLoading] = useState(false);
    const onChangeSearch = newSearchValue => {
        setSearchValue(newSearchValue);
        setSearchResults([]);
        setHasSearched(false);
    };
    const handleSearch = () => {
        if (searchValue !== '') {
            const url = `/api/orgunits/?searches=[{"validation_status":"VALID","search":"${searchValue}"}]&order=name&page=1&limit=${resultsCount}&smallSearch=True`;
            seIsLoading(true);
            getRequest(url).then(res => {
                seIsLoading(false);
                setSearchResults(res.orgunits);
                setHasSearched(true);
            });
        }
    };
    const handleSelect = ou => {
        onSelectOrgUnit(ou);
        setIsSearchActive(false);
    };
    const handleResultCountChange = newResultCount => {
        setResultsCount(parseInt(newResultCount, 10));
        setResultsCountChanged(true);
    };
    const validateResultCountChange = () => {
        setResultsCountChanged(false);
        handleSearch();
    };
    return (
        <Box className={classes.root}>
            <ClickAwayListener onClickAway={() => setIsSearchActive(false)}>
                <Box
                    className={classes.container}
                    onFocus={() => setIsSearchActive(true)}
                >
                    <Box className={classes.searchBar}>
                        <InputComponent
                            disabled={isLoading}
                            keyValue="orgUnitSearch"
                            onChange={(key, value) => onChangeSearch(value)}
                            value={searchValue}
                            type="search"
                            label={inputLabelObject}
                            onEnterPressed={() => handleSearch()}
                        />
                        {/* //TODO make optional and default to false */}
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
                        hasSearched && (
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
                                {searchResults.map(ou => (
                                    <ListItem
                                        key={ou.id}
                                        button
                                        onClick={() => handleSelect(ou)}
                                        className="org-unit-item"
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography type="body2">
                                                    {getOrgunitMessage(
                                                        ou,
                                                        true,
                                                    )}
                                                </Typography>
                                            }
                                        />
                                        <OrgUnitTooltip
                                            orgUnit={ou}
                                            enterDelay={0}
                                            enterNextDelay={0}
                                        >
                                            <InfoOutlinedIcon
                                                fontSize="small"
                                                style={{
                                                    color: rawTheme.palette
                                                        .mediumGray.main,
                                                }}
                                            />
                                        </OrgUnitTooltip>
                                    </ListItem>
                                ))}
                            </List>
                            <Divider />
                            <Box className={classes.resultInfos}>
                                <FormattedMessage {...MESSAGES.display} />
                                <div className={classes.countContainer}>
                                    <InputBase
                                        id="search-results-count"
                                        value={resultsCount}
                                        type="number"
                                        min={minResultCount}
                                        onChange={event =>
                                            handleResultCountChange(
                                                event.target.value,
                                            )
                                        }
                                        inputProps={{
                                            className:
                                                classes.resultsCountInput,
                                            style: {
                                                width: `${
                                                    resultsCount.toString()
                                                        .length *
                                                        10 +
                                                    10
                                                }px`,
                                            },
                                        }}
                                    />
                                    <IconButton
                                        className={classes.iconButton}
                                        size="small"
                                        onClick={() =>
                                            validateResultCountChange()
                                        }
                                        disabled={!resultsCountChanged}
                                    >
                                        <CheckCircleOutlineIcon
                                            fontSize="small"
                                            color={
                                                resultsCountChanged
                                                    ? 'primary'
                                                    : 'inherit'
                                            }
                                        />
                                    </IconButton>
                                </div>
                                <FormattedMessage {...MESSAGES.resultsLower} />
                            </Box>
                        </Box>
                    )}
                </Box>
            </ClickAwayListener>
        </Box>
    );
};

OrgUnitSearch.defaultProps = {
    minResultCount: 50,
    inputLabelObject: MESSAGES.searchOrgUnit,
    withSearchButton: false,
};

OrgUnitSearch.propTypes = {
    classes: PropTypes.object.isRequired,
    onSelectOrgUnit: PropTypes.func.isRequired,
    minResultCount: PropTypes.number,
    inputLabelObject: PropTypes.object,
    withSearchButton: PropTypes.bool,
};

export default withStyles(styles)(OrgUnitSearch);
