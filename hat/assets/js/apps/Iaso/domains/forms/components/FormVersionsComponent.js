import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import {
    useSafeIntl,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import FormVersionsDialog from './FormVersionsDialogComponent';
import { baseUrls } from '../../../constants/urls.ts';
import MESSAGES from '../messages';
import { PERIOD_TYPE_DAY } from '../../periods/constants';
import { FormVersionsTable } from './FormVersionsTable.tsx';

const baseUrl = baseUrls.formDetail;
const FormVersionsComponent = ({ periodType, formId, params }) => {
    const { formatMessage } = useSafeIntl();
    if (!formId) return null;
    const templateUrl = `${
        window.STATIC_URL ?? '/static/'
    }templates/XLSForm_Template.xlsx`;
    return (
        <Box>
            <Box
                mb={2}
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
            >
                <Button
                    sx={{ mr: 2 }}
                    variant="outlined"
                    href={templateUrl}
                    target="_blank"
                    download
                >
                    {formatMessage(MESSAGES.downloadTemplate)}
                </Button>
                <FormVersionsDialog
                    formId={formId}
                    periodType={periodType}
                    titleMessage={MESSAGES.createFormVersion}
                    renderTrigger={({ openDialog }) => (
                        <AddButtonComponent
                            onClick={openDialog}
                            message={MESSAGES.createFormVersion}
                            dataTestId="open-dialog-button"
                        />
                    )}
                />
            </Box>
            <FormVersionsTable
                baseUrl={baseUrl}
                params={params}
                formId={formId}
                periodType={periodType}
            />
        </Box>
    );
};

FormVersionsComponent.defaultProps = {
    periodType: PERIOD_TYPE_DAY,
    formId: null,
};

FormVersionsComponent.propTypes = {
    periodType: PropTypes.string,
    formId: PropTypes.number,
    params: PropTypes.object.isRequired,
};

export default FormVersionsComponent;
