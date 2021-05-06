import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import InputComponent from '../../../components/forms/InputComponent';
import ExportButtonComponent from '../../../components/buttons/ExportButtonComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { createExportRequest as createExportRequestAction } from '../actions';

import MESSAGES from '../messages';

import injectIntl from '../../../libs/intl/injectIntl';

const ExportInstancesDialogComponent = ({
    isInstancesFilterUpdated,
    getFilters,
    createExportRequest,
    batchExport,
}) => {
    const [forceExport, setForceExport] = React.useState(false);
    const onConfirm = closeDialog => {
        const filterParams = getFilters();
        createExportRequest({ forceExport, ...filterParams }).then(() =>
            closeDialog(),
        );
    };
    const onClosed = () => {
        setForceExport(false);
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <ExportButtonComponent
                    onClick={openDialog}
                    isDisabled={isInstancesFilterUpdated}
                    batchExport={batchExport}
                />
            )}
            titleMessage={MESSAGES.export}
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
    batchExport: true,
};

ExportInstancesDialogComponent.propTypes = {
    isInstancesFilterUpdated: PropTypes.bool.isRequired,
    getFilters: PropTypes.func.isRequired,
    createExportRequest: PropTypes.func.isRequired,
    batchExport: PropTypes.bool,
};

const MapStateToProps = state => ({
    isInstancesFilterUpdated: state.instances.isInstancesFilterUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    ...bindActionCreators(
        {
            createExportRequest: createExportRequestAction,
        },
        dispatch,
    ),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(injectIntl(ExportInstancesDialogComponent));
