import React, { FunctionComponent } from 'react';
import { Divider, Link } from '@mui/material';
import {
    textPlaceholder,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { Link as RouterLink } from 'react-router-dom';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import MESSAGES from '../messages';
import InstanceDetailsField from './InstanceDetailsField';

const formatUnixTimestamp = unix =>
    unix ? moment.unix(unix).format('LTS') : textPlaceholder;

type Props = {
    currentInstance: any;
};

/**
 * Body of the export requests panel, without any surrounding paper, so it can
 * be dropped either in a WidgetPaper or in an accordion row of the detail rail.
 */
export const InstanceDetailsExportRequestsContent: FunctionComponent<Props> = ({
    currentInstance,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <InstanceDetailsField
                label={formatMessage(MESSAGES.dhis2Mappings)}
                valueTitle={null}
                renderValue={() => (
                    <Link
                        component={RouterLink}
                        to={`/forms/mappings/formId/${currentInstance.form_id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
                        color="primary"
                        underline="hover"
                    >
                        {formatMessage(MESSAGES.link)}
                    </Link>
                )}
            />
            <InstanceDetailsField
                label={formatMessage(MESSAGES.lastExportSuccessAt)}
                valueTitle={null}
                value={formatUnixTimestamp(
                    currentInstance.last_export_success_at,
                )}
            />
            {currentInstance.export_statuses &&
                currentInstance.export_statuses.length > 0 && <Divider />}
            {currentInstance.export_statuses.map((exportStatus, index) => (
                <React.Fragment
                    key={`${exportStatus.export_request.created_at}-${exportStatus.export_request.launcher.full_name}`}
                >
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
                            value={
                                exportStatus.export_request.last_error_message
                            }
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
        </>
    );
};

const InstanceDetailsExportRequests: FunctionComponent<Props> = ({
    currentInstance,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
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
            <InstanceDetailsExportRequestsContent
                currentInstance={currentInstance}
            />
        </WidgetPaper>
    );
};

export default InstanceDetailsExportRequests;
