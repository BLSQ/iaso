import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setForms } from './actions';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';

import formsTableColumns from './config';

import TopBar from '../../components/nav/TopBarComponent';
import FormDialogComponent from './components/FormDialogComponent';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';
import SingleTable from '../../components/tables/SingleTable';
import { fetchForms } from '../../utils/requests';

import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';

import { baseUrls } from '../../constants/urls';

const baseUrl = baseUrls.forms;

const Forms = () => {
    const [forceRefresh, setForceRefresh] = useState(false);
    const reduxPage = useSelector(state => state.forms.formsPage);
    const dispatch = useDispatch();
    const intl = useSafeIntl();
    useEffect(() => {
        dispatch(fetchAllProjects());
        dispatch(fetchAllOrgUnitTypes());
    }, []);
    return (
        <>
            <TopBar title={intl.formatMessage(MESSAGES.title)} />
            <SingleTable
                baseUrl={baseUrl}
                endPointPath="forms"
                dataKey="forms"
                apiParams={{
                    all: true,
                }}
                fetchItems={fetchForms}
                defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                columns={formsTableColumns(intl.formatMessage)}
                hideGpkg
                defaultPageSize={50}
                onDataLoaded={({ list, count, pages }) => {
                    dispatch(setForms(list, count, pages));
                }}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                results={reduxPage}
                extraComponent={
                    <FormDialogComponent
                        titleMessage={MESSAGES.createForm}
                        renderTrigger={({ openDialog }) => (
                            <AddButtonComponent onClick={openDialog} />
                        )}
                        onSuccess={() => setForceRefresh(true)}
                    />
                }
            />
        </>
    );
};

export default Forms;
