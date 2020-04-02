import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";

import { withStyles } from "@material-ui/core";
import { Grid } from "@material-ui/core";
import PropTypes from "prop-types";

import {
  setCurrentMappingVersion as setCurrentMappingVersionAction,
  fetchMappingVersionDetail as fetchMappingVersionDetailAction,
  setCurrentQuestion as setCurrentQuestionAction
} from "./actions";

import { redirectToReplace as redirectToReplaceAction } from "../../routing/actions";

import TopBar from "../../components/nav/TopBarComponent";
import LoadingSpinner from "../../components/LoadingSpinnerComponent";
import RecursiveTreeView from "./components/RecursiveTreeView";
import QuestionInfos from "./components/QuestionInfos";
import QuestionMappingForm from "./components/QuestionMappingForm";
import commonStyles from "../../styles/common";

const styles = theme => ({
  ...commonStyles(theme),
  icon: {
    width: 30,
    height: "auto",
    display: "block",
    cursor: "pointer"
  }
});

class MappingDetails extends Component {
  constructor(props) {
    super(props);
    props.setCurrentMappingVersion(null);
  }

  componentDidMount() {
    const {
      params: { mappingVersionId, questionName },
      fetchMappingVersionDetail
    } = this.props;
    fetchMappingVersionDetail(mappingVersionId, questionName);
  }

  render() {
    const {
      classes,
      fetching,
      currentMappingVersion,
      currentFormVersion,
      currentQuestion,
      setCurrentQuestion,
      intl: { formatMessage },
      router,
      prevPathname,
      redirectToReplace
    } = this.props;

    const onQuestionSelected = node => {
      setCurrentQuestion(node);
      redirectToReplace("/settings/mapping", {
        mappingVersionId: currentFormVersion.id,
        questionName: node.name
      });
    };

    return (
      <section className={classes.relativeContainer}>
        <TopBar
          title={
            currentMappingVersion
              ? "Mapping : " +
                currentMappingVersion.form_version.form.name +
                ",  " +
                currentMappingVersion.form_version.version_id +
                " - " +
                currentMappingVersion.mapping.mapping_type
              : "loading"
          }
          displayBackButton
          goBack={() => {
            if (prevPathname || !currentMappingVersion) {
              router.goBack();
            } else {
              redirectToReplace("/settings/mappings", {});
            }
          }}
        />
        {fetching && <LoadingSpinner />}
        {currentMappingVersion && (
          <Grid container>
            {currentFormVersion && currentMappingVersion && (
              <Grid item>
                <RecursiveTreeView
                  formVersion={currentFormVersion}
                  mappingVersion={currentMappingVersion}
                  onQuestionSelected={onQuestionSelected}
                ></RecursiveTreeView>
              </Grid>
            )}
            <Grid item>
              {currentQuestion && (
                <>
                  <QuestionInfos question={currentQuestion}></QuestionInfos>
                  <QuestionMappingForm
                    mapping={currentMappingVersion}
                    question={currentQuestion}
                  ></QuestionMappingForm>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </section>
    );
  }
}
MappingDetails.defaultProps = {
  prevPathname: null,
  currentInstance: null
};

MappingDetails.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  fetching: PropTypes.bool.isRequired,
  router: PropTypes.object.isRequired,
  redirectToReplace: PropTypes.func.isRequired,
  prevPathname: PropTypes.any,
  currentMappingVersion: PropTypes.object,
  currentFormVersion: PropTypes.object,
  fetchMappingVersionDetail: PropTypes.func.isRequired,
  setCurrentMappingVersion: PropTypes.func.isRequired
};

const MapStateToProps = state => ({
  fetching: state.mappings.fetching,
  currentMappingVersion: state.mappings.current,
  currentFormVersion: state.mappings.currentFormVersion,
  currentQuestion: state.mappings.currentQuestion,
  prevPathname: state.routerCustom.prevPathname
});

const MapDispatchToProps = dispatch => ({
  ...bindActionCreators(
    {
      fetchMappingVersionDetail: fetchMappingVersionDetailAction,
      redirectToReplace: redirectToReplaceAction,
      setCurrentMappingVersion: setCurrentMappingVersionAction,
      setCurrentQuestion: setCurrentQuestionAction
    },
    dispatch
  )
});

export default withStyles(styles)(
  connect(MapStateToProps, MapDispatchToProps)(injectIntl(MappingDetails))
);
