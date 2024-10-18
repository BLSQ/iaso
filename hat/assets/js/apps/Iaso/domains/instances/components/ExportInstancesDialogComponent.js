import PropTypes from 'prop-types';
import React from 'react';

import { injectIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { createExportRequest } from '../actions';

import MESSAGES from '../messages';

const ExportInstancesDialogComponent = ({
    getFilters,
    renderTrigger,
    selection,
}) => {
    const [forceExport, setForceExport] = React.useState(false);
    const onConfirm = closeDialog => {
        const filterParams = getFilters();
        createExportRequest({ forceExport, ...filterParams }, selection).then(
            () => closeDialog(),
        );
    };
    const onClosed = () => {
        setForceExport(false);
    };
    let title = MESSAGES.export;
    if (selection) {
        title = {
            ...MESSAGES.exportSelection,
            values: {
                count: selection.selectCount,
            },
        };
    }
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => renderTrigger(openDialog)}
            titleMessage={title}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.export}
            onClosed={onClosed}
            cancelMessage={MESSAGES.cancel}
            maxWidth="xs"
        >
            <p />
            <InputComponent
                clearable
                keyValue="algoId"
                onChange={() => setForceExport(!forceExport)}
                value={forceExport}
                type="checkbox"
                label={MESSAGES.forceExport}
            />
        </ConfirmCancelDialogComponent>
    );
};
ExportInstancesDialogComponent.defaultProps = {
    selection: null,
};

ExportInstancesDialogComponent.propTypes = {
    getFilters: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    selection: PropTypes.object,
};

export default injectIntl(ExportInstancesDialogComponent);
