import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import { fetchList } from '../../../utils/requests';

import SingleTable from '../../../components/tables/SingleTable';
import AddButtonComponent from '../../../components/buttons/AddButtonComponent';
import FormVersionsDialog from './FormVersionsDialogComponent';

import { baseUrls } from '../../../constants/urls';

import { formVersionsTableColumns } from '../config';
import { useSafeIntl } from '../../../hooks/intl';
import MESSAGES from '../messages';

const baseUrl = baseUrls.formDetail;
const defaultOrder = 'start_period';
const FormVersionsComponent = ({
    forceRefresh,
    setForceRefresh,
    currentForm,
    formId,
}) => {
    const intl = useSafeIntl();
    return (
        <Box mt={4}>
            <Typography color="primary" variant="h5">
                <FormattedMessage {...MESSAGES.versions} />
            </Typography>
            <SingleTable
                isFullHeight={false}
                baseUrl={baseUrl}
                endPointPath="formversions"
                exportButtons={false}
                dataKey="form_versions"
                defaultPageSize={20}
                fetchItems={(d, url) =>
                    fetchList(
                        d,
                        `${url}&form_id=${formId}`,
                        'fetchFormVersionsError',
                        'form versions',
                    )
                }
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={formVersionsTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                    currentForm,
                )}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
            />
            <Box
                mt={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <FormVersionsDialog
                    currentForm={currentForm}
                    titleMessage={MESSAGES.createFormVersion}
                    renderTrigger={({ openDialog }) => (
                        <AddButtonComponent onClick={openDialog} />
                    )}
                    onConfirmed={() => setForceRefresh(true)}
                />
            </Box>
        </Box>
    );
};
FormVersionsComponent.propTypes = {
    currentForm: PropTypes.object.isRequired,
    formId: PropTypes.string.isRequired,
    forceRefresh: PropTypes.bool.isRequired,
    setForceRefresh: PropTypes.func.isRequired,
};

export default FormVersionsComponent;
