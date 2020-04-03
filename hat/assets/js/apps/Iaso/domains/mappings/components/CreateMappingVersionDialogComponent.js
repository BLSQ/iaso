import React from "react";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputComponent from "../../../components/forms/InputComponent";
import AddButtonComponent from "../../../components/buttons/AddButtonComponent";
import ConfirmCancelDialogComponent from "../../../components/dialogs/ConfirmCancelDialogComponent";
import IasoSearchComponent from "./IasoSearchComponent";
import Dhis2Search from "./Dhis2SearchComponent";
import {
  createMappingRequest as createMappingRequestAction,
  fetchSources as fetchSourcesAction
} from "../actions";

const mappingTypeOptions = ["AGGREGATE", "EVENT"].map(mappingType => ({
  value: mappingType,
  label: {
    id: `iaso.label.mappingType.${mappingType.toLowerCase()}`,
    defaultMessage: mappingType.toLowerCase()
  }
}));

const CreateMappingVersionDialogComponent = ({
  createMappingRequest,
  fetchSources,
  mappingSources,
  intl
}) => {
  const [mappingType, setMappingType] = React.useState("AGGREGATE");
  const [source, setSource] = React.useState(0);
  const [formVersion, setFormVersion] = React.useState(0);

  React.useEffect(() => {
    fetchSources();
  }, []);

  const onConfirm = closeDialog => {
    createMappingRequest({
      form_version: { id: formVersion },
      mapping: { type: mappingType, datasource: { id: source } }
    }).then(() => closeDialog());
  };
  const onClosed = () => {
    setFormVersion(null);
  };

  return (
    <ConfirmCancelDialogComponent
      renderTrigger={({ openDialog }) => (
        <AddButtonComponent onClick={openDialog} />
      )}
      titleMessage={{
        id: "iaso.mappings.create",
        defaultMessage: "Create Mapping"
      }}
      onConfirm={onConfirm}
      confirmMessage={{ id: "iaso.label.add", defaultMessage: "Add" }}
      onClosed={onClosed}
      cancelMessage={{ id: "iaso.label.cancel", defaultMessage: "Cancel" }}
      maxWidth="md"
    >
      <InputComponent
        keyValue="mapping_type"
        onChange={(key, value) => setMappingType(value)}
        value={mappingType}
        type="select"
        options={mappingTypeOptions}
        label={{
          id: "iaso.mapping.mappingType",
          defaultMessage: "Mapping type"
        }}
      />

      {mappingSources && (
        <FormControl>
          <Select
            placeholder="Pick a source"
            onChange={event => {
              setSource(event.target.value);
            }}
          >
            {mappingSources.map(source => {
              return <MenuItem value={source.id}>{source.name}</MenuItem>;
            })}
          </Select>
        </FormControl>
      )}
      <IasoSearchComponent
        resourceName="formversions"
        collectionName="form_versions"
        mapOptions={options => {
          return options.map(o => {
            return { name: [o.form_name, o.version_id].join(" - "), id: o.id };
          });
        }}
        onChange={(name, val) => {
          setFormVersion(val.id);
        }}
      />
      {source !== 0 && (
        <Dhis2Search
          key={mappingType + " " + source}
          resourceName={mappingType == "AGGREGATE" ? "dataSets" : "programs"}
          fields={"id,name,periodType"}
          mapOptions={options => {
            return options.map(o => {
              return { name: o.name + " (" + o.periodType + ")", id: o.id };
            });
          }}
          dataSourceId={source}
        ></Dhis2Search>
      )}
    </ConfirmCancelDialogComponent>
  );
};

CreateMappingVersionDialogComponent.propTypes = {
  createMappingRequest: PropTypes.func.isRequired
};

const MapStateToProps = state => ({
  mappingSources: state.mappings.mappingSources
});

const MapDispatchToProps = dispatch => ({
  dispatch,
  ...bindActionCreators(
    {
      createMappingRequest: createMappingRequestAction,
      fetchSources: fetchSourcesAction
    },
    dispatch
  )
});

export default connect(
  MapStateToProps,
  MapDispatchToProps
)(injectIntl(CreateMappingVersionDialogComponent));
