import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import {
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import { fetchList } from '../../../utils/requests';

import SingleTable from '../../../components/tables/SingleTable';
import FormVersionsDialog from './FormVersionsDialogComponent';

import { baseUrls } from '../../../constants/urls';

import { formVersionsTableColumns } from '../config';
import MESSAGES from '../messages';
import { PERIOD_TYPE_DAY } from '../../periods/constants';

const baseUrl = baseUrls.formDetail;
const defaultOrder = 'version_id';
const FormVersionsComponent = ({
    forceRefresh,
    setForceRefresh,
    periodType,
    formId,
}) => {
    const intl = useSafeIntl();

    if (!formId) return null;

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
                    formId,
                    periodType,
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
                    formId={formId}
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
    setForceRefresh: () => null,
    forceRefresh: false,
    formId: null,
};

FormVersionsComponent.propTypes = {
    periodType: PropTypes.string,
    forceRefresh: PropTypes.bool,
    setForceRefresh: PropTypes.func,
    formId: PropTypes.number,
};

export default FormVersionsComponent;
