import React from "react";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Grid from "@material-ui/core/Grid";
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
  const [dataset, setDataset] = React.useState(0);

  React.useEffect(() => {
    fetchSources();
  }, []);

  const onConfirm = closeDialog => {
    const payload = {
      form_version: { id: formVersion },
      mapping: { type: mappingType, datasource: { id: source } },
      dataset: dataset
    };
    createMappingRequest(payload).then(complete => {
      closeDialog();
    });
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
      <Grid container spacing={1} direction="column">
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
          <Grid>
            <TextField
              style={{ marginTop: "30px" }}
              select
              fullWidth
              label="Source"
              variant="outlined"
              onChange={event => {
                setSource(event.target.value);
              }}
            >
              {mappingSources.map(source => {
                return <MenuItem value={source.id}>{source.name}</MenuItem>;
              })}
            </TextField>
          </Grid>
        )}
        <Grid>
          <IasoSearchComponent
            resourceName="formversions"
            collectionName="form_versions"
            label="Form version"
            mapOptions={options => {
              return options.map(o => {
                return {
                  name: [o.form_name, o.version_id].join(" - "),
                  id: o.id
                };
              });
            }}
            onChange={(name, val) => {
              setFormVersion(val.id);
            }}
          />
        </Grid>
        <Grid>
          <Dhis2Search
            key={mappingType + " " + source}
            resourceName={mappingType == "AGGREGATE" ? "dataSets" : "programs"}
            fields={"id,name,periodType"}
            label={mappingType == "AGGREGATE" ? "dataSet" : "program"}
            mapOptions={options => {
              return options.map(o => {
                return { name: o.name + " (" + o.periodType + ")", id: o.id };
              });
            }}
            dataSourceId={source}
            onChange={(name, val) => {
              setDataset(val);
            }}
          ></Dhis2Search>
        </Grid>
      </Grid>
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
