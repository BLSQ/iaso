
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import { currentUserActions } from '../../../redux/currentUserReducer';
import { profileActions } from '../../../redux/profilesReducer';
import { testActions } from '../redux/testReducer';
import { filterActions } from '../../../redux/filtersRedux';

import TestInfosComponent from './TestInfosComponent';

class TestModalComponent extends Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            currentTest: {
                ...props.currentTest,
                tester: props.currentTest.tester ? props.currentTest.tester.id : null,
                form: props.currentCase.id,
                villageId: props.currentTest.village && props.currentTest.village.id,
            },
            currentCase: props.currentCase,
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

        const {
            selectTestProvince,
            currentTest: {
                village,
            },
        } = this.props;
        if (village) {
            selectTestProvince(village.province_id, village.ZS_id, village.AS_id, village.id);
        } else {
            selectTestProvince(null);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(this.props.currentTest, nextProps.currentTest)) {
            this.setState({
                currentTest: {
                    ...nextProps.currentTest,
                    tester: nextProps.currentTest.tester ? nextProps.currentTest.tester.id : null,
                    form: nextProps.currentCase.id,
                    villageId: nextProps.currentTest.village && nextProps.currentTest.village.id,
                },
            });
        }
        if (!isEqual(this.props.currentCase, nextProps.currentCase)) {
            this.setState({
                currentCase: nextProps.currentCase,
            });
        }

        const {
            selectTestProvince,
            currentTest: {
                village,
            },
        } = nextProps;
        if (village && village.id !== this.props.currentTest.village.id) {
            selectTestProvince(village.province_id, village.ZS_id, village.AS_id, village.id);
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
            currentCase,
        } = this.state;
        const {
            updateTest,
            createTest,
            patientId,
        } = this.props;
        currentTest.currentCase = currentCase;
        if (currentTest.id !== 0) {
            updateTest(currentTest, patientId);
        } else {
            createTest(currentTest, patientId);
        }
    }

    isSaveDisabled() {
        const {
            currentTest,
            currentCase,
        } = this.state;
        const isNewTest = currentTest.id === 0;
        const isUnTouched = isEqual(currentCase, this.props.currentCase)
        && isEqual(currentTest, this.props.currentTest);
        const isValid = (
            Boolean(currentTest.type)
            && Boolean(currentTest.type === 'CATT' && currentTest.index)
            && Boolean(currentTest.type === 'PL' && currentCase.test_pl_gb_mm3)
            && Boolean(currentTest.type === 'clinicalsigns' && currentTest.clinicalsigns.length > 0)
            && Boolean(currentTest.date)
            && Boolean(currentTest.villageId)
        );
        return ((isNewTest && isUnTouched) || !isValid);
    }

    render() {
        const {
            toggleModal,
            showModale,
        } = this.props;
        const {
            currentTest,
            currentCase,
        } = this.state;
        const isNewTest = currentTest.id === 0;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

                <section className="large-modal-content">
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
                        <TestInfosComponent
                            currentCase={currentCase}
                            currentTest={currentTest}
                            onChange={(key, value, type) => this.onChange(key, value, type)}
                        />
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
                                disabled={this.isSaveDisabled()}
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
        village: null,
    },
};

TestModalComponent.propTypes = {
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
    patientId: PropTypes.number.isRequired,
    selectTestProvince: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
    currentUser: state.currentUser.user,
    profiles: state.profiles.list,
    testLocationFilters: state.testLocationFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    fetchProfiles: () => dispatch(profileActions.fetchProfiles(dispatch)),
    updateTest: (test, patientId) => dispatch(testActions.updateTest(dispatch, test, patientId)),
    createTest: (test, patientId) => dispatch(testActions.createTest(dispatch, test, patientId)),
    selectTestProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
});


export default connect(MapStateToProps, MapDispatchToProps)(TestModalComponent);
