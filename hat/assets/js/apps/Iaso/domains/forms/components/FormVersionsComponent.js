import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { fetchList } from '../../../utils/requests';

import SingleTable from '../../../components/tables/SingleTable';
import AddButtonComponent from '../../../components/buttons/AddButtonComponent';
import FormVersionsDialog from './FormVersionsDialogComponent';

import { baseUrls } from '../../../constants/urls';

import { formVersionsTableColumns } from '../config';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { PERIOD_TYPE_DAY } from '../../periods/constants';

const baseUrl = baseUrls.formDetail;
const defaultOrder = 'version_id';
const FormVersionsComponent = ({
    forceRefresh,
    setForceRefresh,
    periodType,
}) => {
    const intl = useSafeIntl();

    const currentForm = useSelector(state => state.forms.current);

    if (!currentForm || (currentForm && !currentForm.id)) return null;
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
                        `${url}&form_id=${currentForm.id}`,
                        'fetchFormVersionsError',
                        'form versions',
                    )
                }
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={formVersionsTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                    currentForm.id,
                    periodType,
                )}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
                watchToRender={periodType}
            />
            <Box
                mt={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <FormVersionsDialog
                    formId={currentForm.id}
                    periodType={periodType}
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

FormVersionsComponent.defaultProps = {
    periodType: PERIOD_TYPE_DAY,
};

FormVersionsComponent.propTypes = {
    periodType: PropTypes.string,
    forceRefresh: PropTypes.bool.isRequired,
    setForceRefresh: PropTypes.func.isRequired,
};

export default FormVersionsComponent;
