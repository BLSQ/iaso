import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';

import { withStyles } from '@material-ui/core';
import { Grid, Box } from '@material-ui/core';
import PropTypes from 'prop-types';

import {
    setCurrentMappingVersion as setCurrentMappingVersionAction,
    fetchMappingVersionDetail as fetchMappingVersionDetailAction,
    setCurrentQuestion as setCurrentQuestionAction,
    applyPartialUpdate as applyPartialUpdateAction,
} from './actions';

import { redirectToReplace as redirectToReplaceAction } from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import RecursiveTreeView from './components/RecursiveTreeView';
import QuestionInfos from './components/QuestionInfos';
import QuestionMappingForm from './components/QuestionMappingForm';
import commonStyles from '../../styles/common';
import { mappingDetailPath, mappingsPath } from '../../constants/paths';

const styles = theme => ({
    ...commonStyles(theme),
    icon: {
        width: 30,
        height: 'auto',
        display: 'block',
        cursor: 'pointer',
    },
});

class MappingDetails extends Component {
    constructor(props) {
        super(props);
        props.setCurrentMappingVersion(null);
    }

    componentDidMount() {
        const {
            params: { mappingVersionId, questionName },
            fetchMappingVersionDetail,
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
            hesabuDescriptor,
            setCurrentQuestion,
            applyPartialUpdate,
            intl: { formatMessage },
            router,
            prevPathname,
            redirectToReplace,
        } = this.props;

        const onQuestionSelected = (node) => {
            setCurrentQuestion(node);
            redirectToReplace(mappingDetailPath.baseUrl, {
                mappingVersionId: currentMappingVersion.id,
                questionName: node.name,
            });
        };

        const onConfirmedQuestionMapping = (questionMapping) => {
            applyPartialUpdate(
                currentMappingVersion.id,
                currentQuestion.name,
                questionMapping,
            );
        };

        const onUnmapQuestionMapping = (questionMapping) => {
            applyPartialUpdate(
                currentMappingVersion.id,
                currentQuestion.name,
                { action: 'unmap' },
            );
        };

        const onNeverMapQuestionMapping = (questionMapping) => {
            applyPartialUpdate(
                currentMappingVersion.id,
                currentQuestion.name,
                { type: 'neverMapped' },
            );
        };

        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    title={
                        currentMappingVersion
                            ? `Mapping : ${
                                currentMappingVersion.form_version.form.name
                            },  ${
                                currentMappingVersion.form_version.version_id
                            } - ${
                                currentMappingVersion.mapping.mapping_type}`
                            : 'loading'
                    }
                    displayBackButton
                    goBack={() => {
                        if (prevPathname || !currentMappingVersion) {
                            router.goBack();
                        } else {
                            redirectToReplace(mappingsPath.baseUrl, {});
                        }
                    }}
                />
                {fetching && <LoadingSpinner />}
                {currentMappingVersion && (
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <Grid container spacing={4}>
                            {currentFormVersion && currentMappingVersion && (
                                <Grid item>
                                    <RecursiveTreeView
                                        formVersion={currentFormVersion}
                                        mappingVersion={currentMappingVersion}
                                        onQuestionSelected={onQuestionSelected}
                                    />
                                </Grid>
                            )}
                            <Grid item>
                                {currentQuestion && (
                                <>
                                    <QuestionInfos question={currentQuestion} />
                                    <br />
                                    <QuestionMappingForm
                                        key={currentQuestion.name}
                                        mapping={currentMappingVersion}
                                        question={currentQuestion}
                                        mappingVersion={currentMappingVersion}
                                        onConfirmedQuestionMapping={onConfirmedQuestionMapping}
                                        onUnmapQuestionMapping={onUnmapQuestionMapping}
                                        onNeverMapQuestionMapping={onNeverMapQuestionMapping}
                                        hesabuDescriptor={hesabuDescriptor}
                                    />
                                </>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </section>
        );
    }
}
MappingDetails.defaultProps = {
    prevPathname: null,
    currentInstance: null,
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
    setCurrentMappingVersion: PropTypes.func.isRequired,
    applyPartialUpdate: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.mappings.fetching,
    currentMappingVersion: state.mappings.current,
    currentFormVersion: state.mappings.currentFormVersion,
    currentQuestion: state.mappings.currentQuestion,
    hesabuDescriptor: state.mappings.hesabuDescriptor,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchMappingVersionDetail: fetchMappingVersionDetailAction,
            redirectToReplace: redirectToReplaceAction,
            setCurrentMappingVersion: setCurrentMappingVersionAction,
            setCurrentQuestion: setCurrentQuestionAction,
            applyPartialUpdate: applyPartialUpdateAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(MappingDetails)),
);
