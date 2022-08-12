import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { makeStyles, Box } from '@material-ui/core';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/orgUnitTypes/actions';

import formsTableColumns from './config';

import { Filters } from './components/Filters.tsx';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import { deleteForm, restoreForm, fetchForms } from '../../utils/requests';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import { useCurrentUser } from '../../utils/usersUtils.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Forms = ({ params }) => {
    const baseUrl = baseUrls.forms;
    const classes = useStyles();
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const currentUser = useCurrentUser();
    const [forceRefresh, setForceRefresh] = useState(false);
    const [textSearchError, setTextSearchError] = useState(false);
    const [showDeleted, setShowDeleted] = useState(params.showDeleted);
    const handleDeleteForm = formId =>
        deleteForm(dispatch, formId).then(() => {
            setForceRefresh(true);
        });
    const handleRestoreForm = formId =>
        restoreForm(dispatch, formId).then(() => {
            setForceRefresh(true);
        });
    useEffect(() => {
        dispatch(fetchAllProjects());
        dispatch(fetchAllOrgUnitTypes());
        // This fix a bug in redux cache when we passed from "archived" to "non-archived" form page and vice versa
        setForceRefresh(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);
    return (
        <>
            <TopBar title={intl.formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    params={params}
                    onErrorChange={setTextSearchError}
                    isSearchDisabled={textSearchError}
                />

                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="forms"
                    dataKey="forms"
                    apiParams={{
                        ...params,
                        all: true,
                        only_deleted: params.showDeleted ? 1 : 0,
                    }}
                    fetchItems={(d, u, newParams, signal) =>
                        fetchForms(d, u, signal).then(res => {
                            if (newParams) {
                                setShowDeleted(Boolean(newParams.showDeleted));
                            }
                            return res;
                        })
                    }
                    defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                    columns={formsTableColumns({
                        formatMessage: intl.formatMessage,
                        user: currentUser,
                        deleteForm: handleDeleteForm,
                        restoreForm: handleRestoreForm,
                        showDeleted,
                    })}
                    hideGpkg
                    defaultPageSize={50}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => setForceRefresh(false)}
                    toggleActiveSearch
                    searchActive
                    isFullHeight={false}
                />
            </Box>
        </>
    );
};

Forms.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Forms;
