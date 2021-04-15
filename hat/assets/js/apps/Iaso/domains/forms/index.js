import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import { setForms } from './actions';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';
import { redirectTo } from '../../routing/actions';

import formsTableColumns from './config';

import TopBar from '../../components/nav/TopBarComponent';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';
import SingleTable from '../../components/tables/SingleTable';
import { fetchForms } from '../../utils/requests';

import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';

import { baseUrls } from '../../constants/urls';
import { formsFilters } from '../../constants/filters';

const baseUrl = baseUrls.forms;

const Forms = props => {
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
                    ...props.params,
                    all: true,
                    only_deleted: props.showOnlyDeleted ? 1 : 0,
                }}
                fetchItems={fetchForms}
                defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                columns={formsTableColumns(intl.formatMessage)}
                hideGpkg
                defaultPageSize={50}
                onDataLoaded={({ list, count, pages }) => {
                    dispatch(setForms(list, count, pages));
                }}
                results={reduxPage}
                extraComponent={
                    <AddButtonComponent
                        onClick={() => {
                            dispatch(
                                redirectTo(baseUrls.formDetail, {
                                    formId: '0',
                                }),
                            );
                        }}
                    />
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
