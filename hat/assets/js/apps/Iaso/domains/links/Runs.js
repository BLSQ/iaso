import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { Button, makeStyles } from '@material-ui/core';
import Autorenew from '@material-ui/icons/Autorenew';

import PropTypes from 'prop-types';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import {
    fetchAlgorithmRuns,
    deleteAlgorithmRun,
    runAlgorithm,
} from '../../utils/requests';

import { redirectTo } from '../../routing/actions';
import TopBar from '../../components/nav/TopBarComponent';

import { runsTableColumns } from './config';

import SingleTable from '../../components/tables/SingleTable';
import AddRunDialogComponent from './components/AddRunDialogComponent';

import { runsFilters } from '../../constants/filters';

import { baseUrls } from '../../constants/urls';
import { useRunsFiltersData } from './hooks';

import MESSAGES from './messages';

const baseUrl = baseUrls.algos;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
}));

const Runs = ({ params }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const intl = useSafeIntl();

    const algorithms = useSelector(state => state.links.algorithmsList);
    const profiles = useSelector(state => state.users.list);
    const sources = useSelector(state => state.orgUnits.sources);

    const [forceRefresh, setForceRefresh] = useState(false);
    const [refreshEnable, setRefreshEnable] = useState(false);
    const [fetchingProfiles, setFetchingProfiles] = useState(false);
    const [fetchingSources, setFetchingSource] = useState(false);
    const [fetchingAlgorithms, setFetchingAlgorithms] = useState(false);
    useRunsFiltersData(
        dispatch,
        setFetchingProfiles,
        setFetchingSource,
        setFetchingProfiles,
        setFetchingAlgorithms,
    );

    const onSelectRunLinks = runItem => {
        dispatch(
            redirectTo(baseUrls.links, {
                algorithmRunId: runItem.id,
                searchActive: true,
            }),
        );
    };

    const onRefresh = () => {
        setForceRefresh(true);
    };

    const deleteRuns = run => {
        return deleteAlgorithmRun(dispatch, run.id).then(() => {
            onRefresh();
        });
    };

    const executeRun = run => {
        runAlgorithm(dispatch, run).then(() => {
            onRefresh();
        });
        setTimeout(() => onRefresh(), 500);
    };

    const [tableColumns] = useState(
        runsTableColumns(intl.formatMessage, onSelectRunLinks, deleteRuns),
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
    return (
        <>
            <TopBar title={intl.formatMessage(MESSAGES.runsTitle)} />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="algorithmsruns"
                exportButtons={false}
                dataKey="runs"
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                apiParams={{
                    ...params,
                }}
                searchActive={params.searchActive === 'true'}
                fetchItems={fetchAlgorithmRuns}
                defaultSorted={[{ id: 'ended_at', desc: true }]}
                toggleActiveSearch
                columns={tableColumns}
                filters={runsFilters({
                    formatMessage: intl.formatMessage,
                    algorithms,
                    profiles,
                    sources,
                    currentOrigin,
                    currentDestination,
                    fetchingProfiles,
                    fetchingAlgorithms,
                    fetchingSources,
                })}
                onDataLoaded={() => setRefreshEnable(true)}
                searchExtraComponent={
                    <Button
                        disabled={!refreshEnable}
                        variant="contained"
                        color="primary"
                        onClick={() => onRefresh()}
                        className={classes.marginRight}
                    >
                        <Autorenew className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.refresh} />
                    </Button>
                }
                extraComponent={
                    <AddRunDialogComponent
                        executeRun={runItem => executeRun(runItem)}
                    />
                }
            />
        </>
    );
};

Runs.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Runs;
