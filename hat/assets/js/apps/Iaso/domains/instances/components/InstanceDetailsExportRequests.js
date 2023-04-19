import React from 'react';
import { Divider } from '@material-ui/core';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
    textPlaceholder,
    injectIntl,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent.tsx';
import InstanceDetailsField from './InstanceDetailsField';

const formatUnixTimestamp = unix =>
    unix ? moment.unix(unix).format('LTS') : textPlaceholder;

const InstanceDetailsExportRequests = ({
    currentInstance,
    intl: { formatMessage },
}) => (
    <WidgetPaper
        id="export-requests"
        padded
        title={formatMessage(MESSAGES.exportRequests)}
        IconButton={IconButtonComponent}
        iconButtonProps={{
            url: `/forms/mappings/formId/${currentInstance.form_id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`,
            color: 'secondary',
            icon: 'dhis',
            tooltipMessage: MESSAGES.dhis2Mappings,
        }}
    >
        <InstanceDetailsField
            label={formatMessage(MESSAGES.lastExportSuccessAt)}
            valueTitle={null}
            value={formatUnixTimestamp(currentInstance.last_export_success_at)}
        />
        {currentInstance.export_statuses &&
            currentInstance.export_statuses.length > 0 && <Divider />}
        {currentInstance.export_statuses.map((exportStatus, index) => (
            <React.Fragment key={index}>
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.exportStatus)}
                    value={exportStatus.status}
                />
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.launcher)}
                    value={[
                        exportStatus.export_request.launcher.full_name,
                        exportStatus.export_request.launcher.email,
                    ]
                        .filter(c => c && c !== '')
                        .join(' - ')}
                />

                {exportStatus.export_request.last_error_message && (
                    <InstanceDetailsField
                        label={formatMessage(MESSAGES.lastErrorMessage)}
                        value={exportStatus.export_request.last_error_message}
                    />
                )}
                <InstanceDetailsField
                    label={formatMessage(MESSAGES.when)}
                    value={formatUnixTimestamp(exportStatus.created_at)}
                />
                {index !== currentInstance.export_statuses.length - 1 && (
                    <Divider />
                )}
            </React.Fragment>
        ))}
    </WidgetPaper>
);

InstanceDetailsExportRequests.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(InstanceDetailsExportRequests);
