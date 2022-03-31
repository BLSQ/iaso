import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/orgUnitTypes/actions';
import { redirectTo } from '../../routing/actions';

import formsTableColumns from './config';

import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import { deleteForm, restoreForm, fetchForms } from '../../utils/requests';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import { formsFilters } from '../../constants/filters';
import { userHasPermission } from '../users/utils';

const Forms = ({ params }) => {
    const baseUrl = baseUrls.forms;
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.users.current);
    const userHasFormsPermission = userHasPermission('iaso_forms', currentUser);
    const [forceRefresh, setForceRefresh] = useState(false);
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
    }, []);
    return (
        <>
            <TopBar title={intl.formatMessage(MESSAGES.title)} />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="forms"
                dataKey="forms"
                apiParams={{
                    ...params,
                    all: true,
                    only_deleted: params.showDeleted ? 1 : 0,
                }}
                fetchItems={(d, u, newParams) =>
                    fetchForms(d, u).then(res => {
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
                extraComponent={
                    userHasFormsPermission && (
                        <AddButtonComponent
                            dataTestId="add-form-button"
                            onClick={() => {
                                dispatch(
                                    redirectTo(baseUrls.formDetail, {
                                        formId: '0',
                                    }),
                                );
                            }}
                        />
                    )
                }
                toggleActiveSearch
                searchActive
                filters={formsFilters()}
            />
        </>
    );
};

Forms.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Forms;
