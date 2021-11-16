import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import { setForms } from './actions';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';
import { redirectTo } from '../../routing/actions';

import formsTableColumns from './config';
import archivedFormsTableColumns from './configArchived';

import TopBar from '../../components/nav/TopBarComponent';
import SingleTable from '../../components/tables/SingleTable';
import { deleteForm, restoreForm, fetchForms } from '../../utils/requests';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import { formsFilters } from '../../constants/filters';
import { userHasPermission } from '../users/utils';

const Forms = ({ params, showOnlyDeleted }) => {
    const baseUrl = showOnlyDeleted ? baseUrls.archived : baseUrls.forms;
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.users.current);
    const userHasFormsPermission = userHasPermission('iaso_forms', currentUser);
    const [forceRefresh, setForceRefresh] = useState(false);
    const handleDeleteForm = formId =>
        deleteForm(dispatch, formId).then(() => {
            setForceRefresh(true);
        });
    const handleRestoreForm = formId =>
        restoreForm(dispatch, formId).then(() => {
            setForceRefresh(true);
        });
    const columnsConfig = showOnlyDeleted
        ? archivedFormsTableColumns(
              intl.formatMessage,
              handleRestoreForm,
              userHasFormsPermission,
          )
        : formsTableColumns({
              formatMessage: intl.formatMessage,
              user: currentUser,
              deleteForm: handleDeleteForm,
          });
    const reduxPage = useSelector(state => state.forms.formsPage);

    useEffect(() => {
        dispatch(fetchAllProjects());
        dispatch(fetchAllOrgUnitTypes());
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
                    only_deleted: showOnlyDeleted ? 1 : 0,
                }}
                fetchItems={fetchForms}
                defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                columns={columnsConfig}
                hideGpkg
                defaultPageSize={50}
                onDataLoaded={({ list, count, pages }) => {
                    dispatch(setForms(list, count, pages));
                }}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                results={reduxPage}
                extraComponent={
                    !showOnlyDeleted &&
                    userHasFormsPermission && (
                        <AddButtonComponent
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
    showOnlyDeleted: PropTypes.bool,
};

Forms.defaultProps = {
    showOnlyDeleted: false,
};

export default Forms;
