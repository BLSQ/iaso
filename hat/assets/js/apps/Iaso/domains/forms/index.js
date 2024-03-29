import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    commonStyles,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import { redirectTo } from '../../routing/actions.ts';

import formsTableColumns from './config';

import { Filters } from './components/Filters.tsx';
import TopBar from '../../components/nav/TopBarComponent';
import SingleTable, {
    useSingleTableParams,
} from '../../components/tables/SingleTable';
import { deleteForm, restoreForm, fetchForms } from '../../utils/requests';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';
import { userHasPermission } from '../users/utils';
import { useCurrentUser } from '../../utils/usersUtils.ts';
import * as Permission from '../../utils/permissions.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Forms = ({ params }) => {
    const baseUrl = baseUrls.forms;
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const currentUser = useCurrentUser();
    const userHasFormsPermission = userHasPermission(
        Permission.FORMS,
        currentUser,
    );
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
        // This fix a bug in redux cache when we passed from "archived" to "non-archived" form page and vice versa
        setForceRefresh(true);
        setShowDeleted(Boolean(params.showDeleted === 'true'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    const apiParams = useSingleTableParams(params);

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters
                    params={apiParams}
                    onErrorChange={setTextSearchError}
                    hasErrors={textSearchError}
                />

                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="forms"
                    dataKey="forms"
                    apiParams={{
                        ...apiParams,
                        all: true,
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
                        formatMessage,
                        user: currentUser,
                        deleteForm: handleDeleteForm,
                        restoreForm: handleRestoreForm,
                        showDeleted,
                        dispatch,
                    })}
                    hideGpkg
                    defaultPageSize={50}
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => setForceRefresh(false)}
                    toggleActiveSearch
                    searchActive
                    isFullHeight={false}
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
                />
            </Box>
        </>
    );
};

Forms.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Forms;
