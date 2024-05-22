import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, useGoBack } from 'bluesquare-components';
import { useLocation } from 'react-router-dom';
import { saveLink, fetchLinks } from '../../utils/requests';

import { linksTableColumns } from './config';

import TopBar from '../../components/nav/TopBarComponent';
import LinksDetails from './components/LinksDetailsComponent';
import SingleTable, {
    useSingleTableParams,
} from '../../components/tables/SingleTable';
import { baseUrls } from '../../constants/urls';
import { linksFilters } from '../../constants/filters';
import { useLinksFiltersData } from './hooks';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';
import MESSAGES from './messages';

const baseUrl = baseUrls.links;

const useStyles = makeStyles(() => ({
    table: {
        '& tr:nth-of-type(odd) .bg-star path': {
            fill: '#f7f7f7 !important',
        },
    },
}));
export const Links = () => {
    const params = useParamsObject(baseUrl);
    const goBack = useGoBack(baseUrls);
    const location = useLocation();
    const intl = useSafeIntl();
    const classes = useStyles();
    const dispatch = useDispatch();
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const sources = useSelector(state => state.orgUnits.sources);
    const profiles = useSelector(state => state.users.list);
    const algorithms = useSelector(state => state.links.algorithmsList);
    const algorithmRuns = useSelector(state => state.links.algorithmRunsList);

    const [expanded, setExpanded] = useState({});
    const [forceRefresh, setForceRefresh] = useState(false);
    const [fetchingRuns, setFetchingRuns] = useState(false);
    const [fetchingOrgUnitTypes, setFetchingOrgUnitTypes] = useState(false);
    const [fetchingProfiles, setFetchingProfiles] = useState(false);
    const [fetchingAlgorithms, setFetchingAlgorithms] = useState(false);
    const [fetchingSources, setFetchingSource] = useState(false);

    useLinksFiltersData({
        dispatch,
        setFetchingRuns,
        setFetchingOrgUnitTypes,
        setFetchingProfiles,
        setFetchingAlgorithms,
        setFetchingSource,
    });

    const validateLink = link => {
        const newLink = {
            ...link,
            validated: !link.validated,
        };
        saveLink(dispatch, newLink).then(() => {
            setForceRefresh(true);
        });
    };
    const [tableColumns] = useState(
        linksTableColumns(intl.formatMessage, link => validateLink(link)),
    );

    const onDataLoaded = () => {
        setExpanded({});
    };

    const displayBackButton = location?.state?.location.includes(
        baseUrls.algos,
    );
    let currentOrigin;
    if (params.origin && sources) {
        currentOrigin = sources.find(s => s.id === parseInt(params.origin, 10));
    }
    let currentDestination;
    if (params.destination && sources) {
        currentDestination = sources.find(
            s => s.id === parseInt(params.destination, 10),
        );
    }
    const apiParams = useSingleTableParams(params);

    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.title)}
                displayBackButton={displayBackButton}
                goBack={() => goBack()}
            />
            <Box className={classes.table}>
                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="links"
                    hideGpkg
                    dataKey="links"
                    apiParams={{
                        ...apiParams,
                    }}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => setForceRefresh(false)}
                    searchActive={params.searchActive === 'true'}
                    fetchItems={fetchLinks}
                    defaultSorted={[{ id: 'similarity_score', desc: true }]}
                    toggleActiveSearch
                    columns={tableColumns}
                    filters={linksFilters({
                        formatMessage: intl.formatMessage,
                        algorithmRuns,
                        orgUnitTypes,
                        profiles,
                        algorithms,
                        sources,
                        currentOrigin,
                        currentDestination,
                        fetchingRuns,
                        fetchingOrgUnitTypes,
                        fetchingProfiles,
                        fetchingAlgorithms,
                        fetchingSources,
                    })}
                    onDataLoaded={({ list, count, pages }) => {
                        onDataLoaded(list, count, pages);
                    }}
                    extraProps={{
                        expanded,
                        onExpandedChange: newExpanded =>
                            setExpanded(newExpanded),
                    }}
                    subComponent={link =>
                        link ? (
                            <LinksDetails
                                linkId={link.id}
                                validated={link.validated}
                                validateLink={() => validateLink(link)}
                            />
                        ) : null
                    }
                    filtersColumnsCount={4}
                />
            </Box>
        </>
    );
};

export default Links;
