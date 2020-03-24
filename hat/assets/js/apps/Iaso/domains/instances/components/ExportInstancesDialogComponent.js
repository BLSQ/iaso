import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import _ from "lodash";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Grid } from "@material-ui/core";

import ExportButtonComponent from "../../../components/buttons/ExportButtonComponent";
import ConfirmCancelDialogComponent from "../../../components/dialogs/ConfirmCancelDialogComponent";
import { createExportRequest as createExportRequestAction } from "../actions";

const ExportInstancesDialogComponent = ({
  isInstancesFilterUpdated,
  getFilters,
  createExportRequest
}) => {
  const onConfirm = closeDialog => {
    const filterParams = getFilters();
    createExportRequest(filterParams).then(() => closeDialog());
  };
  const onClosed = () => {};
  return (
    <ConfirmCancelDialogComponent
      renderTrigger={({ openDialog }) => (
        <ExportButtonComponent
          onClick={openDialog}
          isDisabled={isInstancesFilterUpdated}
        />
      )}
      titleMessage={{ id: "iaso.instances.export", defaultMessage: "Export" }}
      onConfirm={onConfirm}
      confirmMessage={{ id: "iaso.label.export", defaultMessage: "Export" }}
      onClosed={onClosed}
      cancelMessage={{ id: "iaso.label.cancel", defaultMessage: "Cancel" }}
      maxWidth="xs"
    >
      <p></p>
    </ConfirmCancelDialogComponent>
  );
};

ExportInstancesDialogComponent.propTypes = {
  isInstancesFilterUpdated: PropTypes.bool.isRequired,
  getFilters: PropTypes.func.isRequired,
  createExportRequest: PropTypes.func.isRequired
};

const MapStateToProps = state => ({
  isInstancesFilterUpdated: state.instances.isInstancesFilterUpdated
});

const MapDispatchToProps = dispatch => ({
  dispatch,
  ...bindActionCreators(
    {
      createExportRequest: createExportRequestAction
    },
    dispatch
  )
});

export default connect(
  MapStateToProps,
  MapDispatchToProps
)(injectIntl(ExportInstancesDialogComponent));
