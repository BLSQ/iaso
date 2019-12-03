
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import {
    testType,
} from '../../../utils/constants/filters';
import TimeSelect from '../../../components/TimeSelectComponent';

const placeholder = {
    id: 'main.label.selectOption',
    defaultMessage: 'Select an option',
};

const dateFormat = 'DD-MM-YYYY';

const getAvailableTestTypes = (testTypes, caseItem) => {
    const testTypesList = [];
    testTypes.forEach((tt) => {
        const testTypeExist = Boolean(caseItem.tests.find(t => t.type === tt.value));
        if (!testTypeExist) {
            testTypesList.push(tt);
        }
    });
    return testTypesList;
};

class TestModalComponent extends Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            currentTest: props.currentTest,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    onChange(key, value) {
        const currentTest = {
            ...this.state.currentTest,
            [key]: value,
        };
        console.log('key', key);
        console.log('value', value);
        this.setState({
            currentTest,
        });
    }

    onSave() {
        const {
            currentTest,
        } = this.state;
        console.log(currentTest);
    }

    render() {
        const {
            toggleModal,
            showModale,
            caseItem,
            intl: {
                formatMessage,
            },
            load: {
                loading,
            },
            testsMapping,
        } = this.props;
        const {
            currentTest,
        } = this.state;
        const testTypeSelect = testType(
            formatMessage,
            {
                id: 'main.label.test_type_select',
                defaultMessage: 'Test type',
            },
            false,
        );
        const saveDisabled = true;
        const isNewTest = currentTest.id === 0;
        const availableTestType = isNewTest
            ? getAvailableTestTypes(testTypeSelect.options, caseItem) : testTypeSelect.options;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
            >

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
                <section className="large-modal-content">
                    <Grid container spacing={2} className="margin-bottom">
                        <Grid
                            xs={4}
                            item
                            container
                            justify="flex-end"
                            alignItems="center"
                        >
                            <FormattedMessage
                                id="main.label.testType"
                                defaultMessage="Test type"
                            />
                            :
                        </Grid>
                        <Grid xs={8} item container justify="flex-start">
                            <Select
                                multi={testTypeSelect.isMultiSelect}
                                clearable={testTypeSelect.isClearable}
                                simpleValue
                                name={testTypeSelect.name}
                                value={currentTest.type}
                                placeholder={formatMessage(placeholder)}
                                options={availableTestType}
                                onChange={value => this.onChange('type', value)}
                            />
                        </Grid>
                        <Grid
                            xs={4}
                            item
                            container
                            justify="flex-end"
                            alignItems="center"
                        >
                            {
                                currentTest.type && currentTest.type === 'PL'
                                && <FormattedMessage id="patientsCasesTests.plResult" defaultMessage="Présence trypanosomes" />
                            }
                            {
                                (!currentTest.type || (currentTest.type && currentTest.type !== 'PL'))
                                && <FormattedMessage id="main.label.result" defaultMessage="Result" />
                            }
                            :
                        </Grid>
                        <Grid xs={8} item container justify="flex-start">
                            <Select
                                multi={false}
                                clearable={false}
                                simpleValue
                                name="result"
                                value={currentTest.result}
                                placeholder={formatMessage(placeholder)}
                                options={Object.keys(testsMapping).map(fieldKey => (
                                    { value: fieldKey, label: testsMapping[fieldKey] }))}
                                onChange={value => this.onChange('result', value)}
                            />
                        </Grid>
                        <Grid
                            xs={4}
                            item
                            container
                            justify="flex-end"
                            alignItems="center"
                        >
                            <FormattedMessage
                                id="main.label.date"
                                defaultMessage="Date"
                            />
                            :
                        </Grid>
                        <Grid xs={8} item container justify="flex-start">
                            <div className="filter__container__select date-select">
                                <DatePicker
                                    dateFormat={dateFormat}
                                    dateFormatCalendar="YYYY-MM-DD"
                                    selected={currentTest.date && moment(currentTest.date)}
                                    onChange={date => this.onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'))}
                                />
                            </div>
                        </Grid>
                        <Grid
                            xs={4}
                            item
                            container
                            justify="flex-end"
                            alignItems="center"
                        >
                            <FormattedMessage
                                id="main.label.time"
                                defaultMessage="Time"
                            />
                            :
                        </Grid>
                        <Grid xs={8} item container justify="flex-start">
                            <TimeSelect
                                dateTime={moment(currentTest.date)}
                                onChange={date => this.onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'))}
                            />
                        </Grid>
                    </Grid>

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
    },
};

TestModalComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    caseItem: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    currentTest: PropTypes.object,
    testsMapping: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TestModalComponent));
