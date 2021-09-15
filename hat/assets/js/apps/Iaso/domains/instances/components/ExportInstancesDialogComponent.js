import React from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { injectIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { createExportRequest as createExportRequestAction } from '../actions';

import MESSAGES from '../messages';

const ExportInstancesDialogComponent = ({
    isInstancesFilterUpdated,
    getFilters,
    createExportRequest,
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
            renderTrigger={({ openDialog }) =>
                renderTrigger(openDialog, isInstancesFilterUpdated)
            }
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
    isInstancesFilterUpdated: PropTypes.bool.isRequired,
    getFilters: PropTypes.func.isRequired,
    createExportRequest: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    selection: PropTypes.object,
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
