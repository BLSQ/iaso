import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router';

import PropTypes from 'prop-types';

import { useSafeIntl } from 'bluesquare-components';
import { saveLink, fetchLinks } from '../../utils/requests';

import { linksTableColumns } from './config';

import TopBar from '../../components/nav/TopBarComponent';
import LinksDetails from './components/LinksDetailsComponent';
import SingleTable from '../../components/tables/SingleTable';

import { baseUrls } from '../../constants/urls';
import { linksFilters } from '../../constants/filters';

import { useLinksFiltersData } from './hooks';

import MESSAGES from './messages';

const baseUrl = baseUrls.links;

export const Links = ({ params, router }) => {
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
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

    const displayBackButton =
        prevPathname && prevPathname.includes('/links/runs/');
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
    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.title)}
                displayBackButton={displayBackButton}
                goBack={() => router.goBack()}
            />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="links"
                hideGpkg
                dataKey="links"
                apiParams={{
                    ...params,
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
                    onExpandedChange: newExpanded => setExpanded(newExpanded),
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
            />
        </>
    );
};

Links.propTypes = {
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

export default withRouter(Links);
