import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";
import { bindActionCreators } from "redux";

import { withStyles } from "@material-ui/core";

import PropTypes from "prop-types";

import {
  setCurrentMappingVersion as setCurrentMappingVersionAction,
  fetchMappingVersionDetail as fetchMappingVersionDetailAction
} from "./actions";

import { redirectToReplace as redirectToReplaceAction } from "../../routing/actions";

import TopBar from "../../components/nav/TopBarComponent";
import LoadingSpinner from "../../components/LoadingSpinnerComponent";

import commonStyles from "../../styles/common";

import { makeStyles } from "@material-ui/core/styles";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";

const styles = theme => ({
  ...commonStyles(theme),
  icon: {
    width: 30,
    height: "auto",
    display: "block",
    cursor: "pointer"
  }
});

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 600,
    maxHeight: 500
  }
});



const RecursiveTreeView = props => {
  const classes = useStyles();
  const { currentFormVersion } = props;

  const descriptor = currentFormVersion.descriptor

  const renderTree = node => (
    <TreeItem key={node.name} nodeId={node.name} label={node.title || node.label}>
      {Array.isArray(node.children)
        ? node.children.map(node => renderTree(node))
        : null}
    </TreeItem>
  );

  return (
    <TreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={[descriptor.title]}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {renderTree(descriptor)}
    </TreeView>
  );
};

class MappingDetails extends Component {
  constructor(props) {
    super(props);
    props.setCurrentMappingVersion(null);
  }

  componentDidMount() {
    const {
      params: { mappingVersionId },
      fetchMappingVersionDetail
    } = this.props;
    fetchMappingVersionDetail(mappingVersionId);
  }

  render() {
    const {
      classes,
      fetching,
      currentMappingVersion,
      currentFormVersion,
      intl: { formatMessage },
      router,
      prevPathname,
      redirectToReplace
    } = this.props;
    return (
      <section className={classes.relativeContainer}>
        <TopBar
          title={currentMappingVersion ? currentMappingVersion.form_version.name : "loading"}
          displayBackButton
          goBack={() => {
            if (prevPathname || !currentInstance) {
              router.goBack();
            } else {
              redirectToReplace("instances", {
                formId: currentInstance.form_id
              });
            }
          }}
        />
        {fetching && <LoadingSpinner />}
        {currentMappingVersion && (
          <div>
            <h1>Hello</h1>
            {currentFormVersion && (
              <RecursiveTreeView
                currentFormVersion={currentFormVersion}
              ></RecursiveTreeView>
            )}
            {/*
            <pre>{JSON.stringify(currentFormVersion)}</pre>
            <pre>{JSON.stringify(currentMappingVersion, null, 2)}</pre>
            */
          }
          </div>
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
  prevPathname: state.routerCustom.prevPathname
});

const MapDispatchToProps = dispatch => ({
  ...bindActionCreators(
    {
      fetchMappingVersionDetail: fetchMappingVersionDetailAction,
      redirectToReplace: redirectToReplaceAction,
      setCurrentMappingVersion: setCurrentMappingVersionAction
    },
    dispatch
  )
});

export default withStyles(styles)(
  connect(MapStateToProps, MapDispatchToProps)(injectIntl(MappingDetails))
);
