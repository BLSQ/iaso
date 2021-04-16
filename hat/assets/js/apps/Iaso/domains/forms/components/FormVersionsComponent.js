import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import { fetchList } from '../../../utils/requests';

import SingleTable from '../../../components/tables/SingleTable';

import { baseUrls } from '../../../constants/urls';

import { formVersionsTableColumns } from '../config';
import { useSafeIntl } from '../../../hooks/intl';
import MESSAGES from '../messages';

const baseUrl = baseUrls.formDetail;
const defaultOrder = 'start_period';
const FormVersionsComponent = ({ formId, forceRefresh, setForceRefresh }) => {
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
                columns={formVersionsTableColumns(intl.formatMessage)}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
            />
        </Box>
    );
};
FormVersionsComponent.propTypes = {
    formId: PropTypes.string.isRequired,
    forceRefresh: PropTypes.bool.isRequired,
    setForceRefresh: PropTypes.func.isRequired,
};

export default FormVersionsComponent;
