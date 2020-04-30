import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    withStyles,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Tooltip,
    IconButton,
    ClickAwayListener,
    InputBase,
} from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

import LoadingSpinner from '../../../components/LoadingSpinnerComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { getRequest } from '../../../libs/Api';
import { getOrgUnitParentsString } from '../utils';

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
        padding: theme.spacing(2, 4),
        display: 'flex',
        justifyContent: 'flex-end',
    },
    iconButton: {
        height: 25,
        marginLeft: theme.spacing(1),
        position: 'relative',
        top: -5,
    },
    resultsCountInput: {
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
        },
        '-moz-appearance': 'textfield',
        textAlign: 'center',
    },
});

const OrgUnitSearch = ({
    classes,
    onSelectOrgUnit,
    minResultCount,
}) => {
    const [searchValue, setSearchValue] = useState('');
    const [resultsCount, setResultsCount] = useState(minResultCount);
    const [resultsCountChanged, setResultsCountChanged] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, seIsLoading] = useState(false);
    const onChangeSearch = (newSearchValue) => {
        setSearchValue(newSearchValue);
        setSearchResults([]);
        setHasSearched(false);
    };
    const handleSearch = () => {
        if (searchValue !== '') {
            const url = `/api/orgunits/?searches=[{"validated":"both","search":"${searchValue}"}]&order=name&page=1&limit=${resultsCount}&small_search=True`;
            seIsLoading(true);
            getRequest(url).then((res) => {
                seIsLoading(false);
                setSearchResults(res.orgunits);
                setHasSearched(true);
            });
        }
    };
    const handleSelect = (ou) => {
        onSelectOrgUnit(ou);
        setIsSearchActive(false);
    };
    const handleResultCountChange = (newResultCount) => {
        setResultsCount(parseInt(newResultCount, 10));
        setResultsCountChanged(true);
    };
    const validateResultCountChange = () => {
        setResultsCountChanged(false);
        handleSearch();
    };
    return (
        <Box
            className={classes.root}
        >
            <ClickAwayListener onClickAway={() => setIsSearchActive(false)}>
                <Box
                    className={classes.container}
                    onFocus={() => setIsSearchActive(true)}
                >
                    <InputComponent
                        keyValue="orgUnitSearch"
                        onChange={(key, value) => onChangeSearch(value)}
                        value={searchValue}
                        type="search"
                        label={{
                            id: 'iaso.orgUnits.search',
                            defaultMessage: 'Search org unit',
                        }}
                        onEnterPressed={() => handleSearch()}
                    />

                    {
                        isLoading && (
                            <div className={classes.loadingContainer}><LoadingSpinner fixed={false} transparent padding={4} size={25} /></div>
                        )
                    }
                    {
                        searchResults.length === 0
                    && isSearchActive
                    && hasSearched
                    && (
                        <Typography variant="body2" align="center" className={classes.noResult}>
                            <FormattedMessage id="iaso.label.noOptions" defaultMessage="No result found" />
                        </Typography>
                    )
                    }
                    {
                        searchResults.length > 0
                    && isSearchActive
                    && (
                        <Box className={classes.listContainer}>
                            <List className={classes.list}>
                                {
                                    searchResults.map(ou => (
                                        <Tooltip
                                            title={getOrgUnitParentsString(ou)}
                                            key={ou.id}
                                            arrow
                                            enterDelay={500}
                                            enterNextDelay={500}
                                        >
                                            <ListItem
                                                key={ou.id}
                                                button
                                                onClick={() => handleSelect(ou)}
                                                className="org-unit-item"
                                            >
                                                <ListItemText
                                                    primary={(
                                                        <Typography type="body2">
                                                            {ou.name}
                                                            {` (${ou.org_unit_type_name})`}
                                                        </Typography>
                                                    )}
                                                />
                                            </ListItem>
                                        </Tooltip>
                                    ))
                                }
                            </List>
                            <Box className={classes.resultInfos}>
                                <FormattedMessage
                                    id="iaso.label.display"
                                    defaultMessage="Display"
                                />
                                <InputBase
                                    id="search-results-count"
                                    value={resultsCount}
                                    type="number"
                                    min={minResultCount}
                                    onChange={event => handleResultCountChange(event.target.value)}
                                    inputProps={{
                                        className: classes.resultsCountInput,
                                        style: {
                                            width: `${(resultsCount.toString().length * 10) + 10}px`,
                                        },
                                    }}
                                />
                                <FormattedMessage
                                    id="iaso.label.resultsLower"
                                    defaultMessage="result(s)"
                                />
                                <IconButton
                                    className={classes.iconButton}
                                    size="small"
                                    onClick={() => validateResultCountChange()}
                                    disabled={!resultsCountChanged}
                                >
                                    <CheckCircleOutlineIcon fontSize="small" color={resultsCountChanged ? 'primary' : 'inherit'} />
                                </IconButton>
                            </Box>
                        </Box>
                    )
                    }
                </Box>
            </ClickAwayListener>
        </Box>
    );
};

OrgUnitSearch.defaultProps = {
    minResultCount: 50,
};

OrgUnitSearch.propTypes = {
    classes: PropTypes.object.isRequired,
    onSelectOrgUnit: PropTypes.func.isRequired,
    minResultCount: PropTypes.number,
};

export default withStyles(styles)(OrgUnitSearch);
