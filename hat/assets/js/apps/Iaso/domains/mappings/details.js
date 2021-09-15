import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Grid, Box, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';

import { commonStyles, LoadingSpinner } from 'bluesquare-components';
import {
    setCurrentMappingVersion as setCurrentMappingVersionAction,
    fetchMappingVersionDetail as fetchMappingVersionDetailAction,
    setCurrentQuestion as setCurrentQuestionAction,
    applyPartialUpdate as applyPartialUpdateAction,
} from './actions';

import { redirectToReplace as redirectToReplaceAction } from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import RecursiveTreeView from './components/RecursiveTreeView';
import QuestionInfos from './components/QuestionInfos';
import QuestionMappingForm from './components/QuestionMappingForm';
import DerivedQuestionMappingForm from './components/DerivedQuestionMappingForm';
import { baseUrls } from '../../constants/urls';

import Descriptor from './descriptor';

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
            router,
            prevPathname,
            redirectToReplace,
        } = this.props;

        const onQuestionSelected = node => {
            setCurrentQuestion(node);
            redirectToReplace(baseUrls.mappingDetail, {
                mappingVersionId: currentMappingVersion.id,
                questionName: node.name,
            });
        };

        const onConfirmedQuestionMapping = questionMapping => {
            applyPartialUpdate(
                currentMappingVersion.id,
                currentQuestion.name,
                questionMapping,
            );
        };

        const onUnmapQuestionMapping = () => {
            applyPartialUpdate(currentMappingVersion.id, currentQuestion.name, {
                action: 'unmap',
            });
        };

        const onNeverMapQuestionMapping = () => {
            applyPartialUpdate(currentMappingVersion.id, currentQuestion.name, {
                type: 'neverMapped',
            });
        };
        const isDataElementMappable =
            currentMappingVersion &&
            currentMappingVersion.mapping.mapping_type !== 'DERIVED';
        const indexedQuestions =
            currentFormVersion &&
            Descriptor.indexQuestions(currentFormVersion.descriptor);

        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    title={
                        currentMappingVersion
                            ? `Mapping : ${currentMappingVersion.form_version.form.name},  ${currentMappingVersion.form_version.version_id} - ${currentMappingVersion.mapping.mapping_type}`
                            : 'loading'
                    }
                    displayBackButton
                    goBack={() => {
                        if (prevPathname || !currentMappingVersion) {
                            router.goBack();
                        } else {
                            redirectToReplace(baseUrls.mappingsPath, {});
                        }
                    }}
                />
                {fetching && <LoadingSpinner />}
                {currentMappingVersion && (
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <Grid container spacing={4}>
                            {currentFormVersion && currentMappingVersion && (
                                <Grid item xs={4} md={3}>
                                    <RecursiveTreeView
                                        formVersion={currentFormVersion}
                                        mappingVersion={currentMappingVersion}
                                        // TODO confirm this prop can safely be deleted
                                        // currentQuestion={currentQuestion}
                                        onQuestionSelected={onQuestionSelected}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={8} md={9}>
                                {currentQuestion && (
                                    <>
                                        <QuestionInfos
                                            question={currentQuestion}
                                        />
                                        <br />
                                        {isDataElementMappable && (
                                            <QuestionMappingForm
                                                key={currentQuestion.name}
                                                mapping={currentMappingVersion}
                                                question={currentQuestion}
                                                mappingVersion={
                                                    currentMappingVersion
                                                }
                                                indexedQuestions={
                                                    indexedQuestions
                                                }
                                                onConfirmedQuestionMapping={
                                                    onConfirmedQuestionMapping
                                                }
                                                onUnmapQuestionMapping={
                                                    onUnmapQuestionMapping
                                                }
                                                onNeverMapQuestionMapping={
                                                    onNeverMapQuestionMapping
                                                }
                                                hesabuDescriptor={
                                                    hesabuDescriptor
                                                }
                                            />
                                        )}
                                        {!isDataElementMappable && (
                                            <DerivedQuestionMappingForm
                                                key={currentQuestion.name}
                                                // TODO confirm this can be safely removed
                                                // mapping={currentMappingVersion}
                                                question={currentQuestion}
                                                mappingVersion={
                                                    currentMappingVersion
                                                }
                                            />
                                        )}
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
    currentQuestion: null,
    currentMappingVersion: null,
    currentFormVersion: null,
    hesabuDescriptor: null,
};

MappingDetails.propTypes = {
    classes: PropTypes.object.isRequired,
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
    setCurrentQuestion: PropTypes.func.isRequired,
    currentQuestion: PropTypes.object,
    hesabuDescriptor: PropTypes.any,
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
    connect(MapStateToProps, MapDispatchToProps)(MappingDetails),
);
