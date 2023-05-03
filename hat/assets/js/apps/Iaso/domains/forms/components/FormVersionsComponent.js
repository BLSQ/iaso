import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box, Typography } from '@material-ui/core';
import {
    useSafeIntl,
    AddButton as AddButtonComponent,
    selectionInitialState,
    setTableSelection,
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
    const [selection, setSelection] = useState(selectionInitialState);

    if (!formId) return null;

    return (
        <Box mt={4}>
            <Typography
                color="primary"
                variant="h5"
                data-test="form-versions-title"
            >
                <FormattedMessage {...MESSAGES.versions} />
            </Typography>
            <Box
                mb={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <FormVersionsDialog
                    formId={formId}
                    periodType={periodType}
                    titleMessage={MESSAGES.createFormVersion}
                    renderTrigger={({ openDialog }) => (
                        <AddButtonComponent
                            onClick={openDialog}
                            message={MESSAGES.createFormVersion}
                        />
                    )}
                    onConfirmed={() => setForceRefresh(true)}
                />
            </Box>
            <SingleTable
                isFullHeight={false}
                baseUrl={baseUrl}
                endPointPath="formversions"
                exportButtons={false}
                dataKey="form_versions"
                defaultPageSize={20}
                fetchItems={(d, url, signal) =>
                    fetchList(
                        d,
                        `${url}&form_id=${formId}`,
                        'fetchFormVersionsError',
                        'form versions',
                        signal,
                    )
                }
                defaultSorted={[{ id: defaultOrder, desc: true }]}
                columns={formVersionsTableColumns(
                    intl.formatMessage,
                    setForceRefresh,
                    formId,
                    periodType,
                )}
                multiSelect
                selection={selection}
                setTableSelection={(selectionType, items, totalCount) => {
                    setSelection(
                        setTableSelection(
                            selection,
                            selectionType,
                            items,
                            totalCount,
                        ),
                    );
                }}
                forceRefresh={forceRefresh}
                onForceRefreshDone={() => setForceRefresh(false)}
            />
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
