
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import { currentUserActions } from '../../../redux/currentUserReducer';
import { profileActions } from '../../../redux/profilesReducer';
import { testActions } from '../redux/testReducer';
import TabsComponent from '../../../components/TabsComponent';
import LocationMapComponent from '../../../components/LocationMapComponent';
import isEqual from 'lodash/isEqual';

import TestInfosComponent from './TestInfosComponent';

const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Informations',
        id: 'main.label.informations',
    },
    localisation: {
        defaultMessage: 'Localisation',
        id: 'main.label.location',
    },
});

class TestModalComponent extends Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            currentTest: {
                ...props.currentTest,
                tester: props.currentTest.tester ? props.currentTest.tester.id : null,
                form: props.currentCase.id,
            },
            currentCase: props.currentCase,
            currentTab: 'infos',
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
        if (!this.props.currentUser) {
            this.props.fetchCurrentUserInfos();
        }
        if (this.props.profiles.length === 0) {
            this.props.fetchProfiles();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props.currentTest, nextProps.currentTest)) {
            this.setState({
                currentTest: {
                    ...nextProps.currentTest,
                    tester: nextProps.currentTest.tester ? nextProps.currentTest.tester.id : null,
                    form: nextProps.currentCase.id,
                },
            });
        }
        if (!isEqual(this.props.currentCase, nextProps.currentCase)) {
            this.setState({
                currentCase: nextProps.currentCase,
            });
        }
    }

    onChange(key, value, type) {
        const newState = {
            ...this.state,
            [type]: {
                ...this.state[type],
                [key]: value,
            },
        };
        this.setState(newState);
    }

    onSave() {
        const {
            currentTest,
        } = this.state;
        const {
            updateTest,
            createTest,
            patientId,
        } = this.props;
        if (currentTest.id !== 0) {
            updateTest(currentTest, patientId);
        } else {
            createTest(currentTest, patientId);
        }
    }

    updateTestPosition(lat, lng) {
        this.onChange('latitude', parseFloat(lat, 10), 'currentTest');
        this.onChange('longitude', parseFloat(lng, 10), 'currentTest');
    }

    updateTestLocation(location) {
        const {
            currentTest,
        } = this.state;
        console.log(location);
    }

    render() {
        const {
            toggleModal,
            showModale,
            intl: {
                formatMessage,
            },
            params,
        } = this.props;
        const {
            currentTest,
            currentCase,
            currentTab,
        } = this.state;
        const isNewTest = currentTest.id === 0;
        const saveDisabled = false;
        console.log(currentTest);
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

                <section className="large-modal-content">
                    <TabsComponent
                        selectTab={key => (this.setState({ currentTab: key }))}
                        isRedirecting={false}
                        currentTab={currentTab}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.localisation), key: 'localisation' },
                        ]}
                        defaultSelect={currentTab}
                    />
                    <div className="widget__header">
                        {
                            !isNewTest
                            && (
                                <Fragment>
                                    <FormattedMessage
                                        id="main.label.test.edit"
                                        defaultMessage="Test"
                                    />
                                    <span>{' '}</span>
                                    {` ID: ${currentTest.id}`}
                                </Fragment>
                            )
                        }
                        {
                            isNewTest
                            && (
                                <FormattedMessage
                                    id="main.label.test.add"
                                    defaultMessage="Add a test"
                                />
                            )
                        }
                    </div>
                    <section className="margin-bottom">
                        {
                            currentTab === 'infos'
                            && (
                                <TestInfosComponent
                                    currentCase={currentCase}
                                    currentTest={currentTest}
                                    onChange={(key, value, type) => this.onChange(key, value, type)}
                                />
                            )
                        }
                        <section className={currentTab !== 'localisation' ? 'hidden-opacity' : ''}>
                            <LocationMapComponent
                                location={currentTest}
                                updateField={(key, value) => this.onChange(key, value, 'currentTest')}
                                filters={[]}
                                params={params}
                                updatePosition={(lat, lng) => this.updateTestPosition(lat, lng)}
                                updateLocation={location => this.updateTestLocation(location)}
                                baseUrl="datas/tests/detail"
                            />
                        </section>
                    </section>
                    <Grid container spacing={2}>
                        <Grid
                            xs={12}
                            item
                            container
                            justify="flex-end"
                        >
                            <button
                                className="button margin-right"
                                onClick={() => this.props.toggleModal()}
                            >
                                <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                            </button>
                            <button
                                disabled={saveDisabled}
                                className="button"
                                onClick={() => this.onSave()}
                            >
                                <i className="fa fa-save" />
                                <FormattedMessage id="main.label.save" defaultMessage="Save" />
                            </button>
                        </Grid>
                    </Grid>
                </section>
            </ReactModal>
        );
    }
}

TestModalComponent.defaultProps = {
    currentTest: {
        id: 0,
        date: new Date(),
    },
};

TestModalComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
    currentTest: PropTypes.object,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    fetchProfiles: PropTypes.func.isRequired,
    updateTest: PropTypes.func.isRequired,
    createTest: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    patientId: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
    currentUser: state.currentUser.user,
    profiles: state.profiles.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    fetchProfiles: () => dispatch(profileActions.fetchProfiles(dispatch)),
    updateTest: (test, patientId) => dispatch(testActions.updateTest(dispatch, test, patientId)),
    createTest: (test, patientId) => dispatch(testActions.createTest(dispatch, test, patientId)),
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TestModalComponent));
