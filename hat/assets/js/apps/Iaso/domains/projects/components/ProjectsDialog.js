import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { Tabs, Tab, withStyles } from '@material-ui/core';
import { injectIntl } from 'react-intl';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import ProjectsInfos from './ProjectsInfos';
import ProjectFeatureFlags from './ProjectFeatureFlags';

import {
    updateProject as updateProjectAction,
    fetchAllApps as fetchAllAppsAction,
    createProject as createProjectAction,
} from '../actions';
import MESSAGES from '../messages';

const styles = theme => ({
    tabs: {
        marginBottom: theme.spacing(4),
    },
    tab: {
        padding: 0,
        width: 'calc(100% / 3)',
        minWidth: 0,
    },
    root: {
        minHeight: 365,
        position: 'relative',
    },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
});

class ProjectDialogComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            project: this.initialProject(),
            tab: 'infos',
        };
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.initialData, this.props.initialData)) {
            this.setInitialState();
        }
    }

    onConfirm(closeDialog) {
        const {
            params,
            fetchAllApps,
            updateProject,
            createProject,
            initialData,
            featureFlags,
        } = this.props;
        const currentProject = {};
        Object.keys(this.state.project).forEach(key => {
            currentProject[key] = this.state.project[key].value;
        });

        currentProject.id = get(initialData, 'app_id', '');
        currentProject.feature_flags = featureFlags.filter(fF =>
            this.state.project.feature_flags.value.includes(fF.id),
        );

        let saveApp;

        if (initialData) {
            saveApp = updateProject(currentProject);
        } else {
            saveApp = createProject(currentProject);
        }
        saveApp
            .then(() => {
                closeDialog();
                this.handleChangeTab('infos');
                this.setState({
                    project: this.initialProject(),
                });
                fetchAllApps(params);
            })
            .catch(error => {
                if (error.status === 400) {
                    this.setFieldErrors(
                        error.details.errorKey,
                        error.details.errorMessage,
                    );
                }
            });
    }

    onClosed() {
        this.setState({ project: this.initialProject() });
        this.handleChangeTab('infos');
    }

    setFieldValue(fieldName, fieldValue) {
        const { project } = this.state;
        this.setState({
            project: {
                ...project,
                [fieldName]: {
                    value: fieldValue,
                    errors: [],
                },
            },
        });
    }

    setFieldErrors(fieldName, fieldError) {
        const { project } = this.state;

        this.setState({
            project: {
                ...project,
                [fieldName]: {
                    value: project[fieldName].value,
                    errors: [fieldError],
                },
            },
        });
    }

    setInitialState() {
        this.setState({
            project: this.initialProject(),
        });
    }

    initialProject(app) {
        let initialData = this.props.initialData ? this.props.initialData : {};
        if (app) {
            initialData = app;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            app_id: { value: get(initialData, 'app_id', ''), errors: [] },
            name: {
                value: get(initialData, 'name', ''),
                errors: [],
            },
            needs_authentication: {
                value: get(initialData, 'needs_authentication', false),
                errors: [],
            },
            feature_flags: {
                value: get(initialData, 'feature_flags', []).map(v => v.id),
                errors: [],
            },
        };
    }

    handleChangeTab(tab) {
        this.setState({
            tab,
        });
    }

    render() {
        const {
            titleMessage,
            renderTrigger,
            initialData,
            featureFlags,
            classes,
            intl: { formatMessage },
        } = this.props;

        const { project, tab } = this.state;

        return (
            <ConfirmCancelDialogComponent
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                onClosed={() => this.onClosed()}
                renderTrigger={renderTrigger}
                maxWidth="xs"
                dialogProps={{
                    classNames: classes.dialog,
                }}
            >
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                    }}
                    onChange={(event, newtab) => this.handleChangeTab(newtab)}
                >
                    <Tab
                        classes={{
                            root: classes.tab,
                        }}
                        value="infos"
                        label={formatMessage(MESSAGES.infos)}
                    />
                    <Tab
                        classes={{
                            root: classes.tab,
                        }}
                        value="feature_flags"
                        label={formatMessage(MESSAGES.feature_flags)}
                    />
                </Tabs>
                <div className={classes.root}>
                    {tab === 'infos' && (
                        <ProjectsInfos
                            setFieldValue={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            initialData={initialData}
                            currentProject={project}
                        />
                    )}
                    {tab === 'feature_flags' && (
                        <ProjectFeatureFlags
                            setFieldValue={(key, value) =>
                                this.setFieldValue('feature_flags', value)
                            }
                            currentProject={project}
                            featureFlags={featureFlags}
                        />
                    )}
                </div>
            </ConfirmCancelDialogComponent>
        );
    }
}

ProjectDialogComponent.defaultProps = {
    initialData: null,
};

ProjectDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    fetchAllApps: PropTypes.func.isRequired,
    updateProject: PropTypes.func.isRequired,
    createProject: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    featureFlags: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    apps: state.projects.list,
    count: state.projects.count,
    pages: state.projects.pages,
    fetching: state.projects.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchAllApps: fetchAllAppsAction,
            updateProject: updateProjectAction,
            createProject: createProjectAction,
        },
        dispatch,
    ),
});
export default withStyles(styles)(
    connect(
        MapStateToProps,
        mapDispatchToProps,
    )(injectIntl(ProjectDialogComponent)),
);
