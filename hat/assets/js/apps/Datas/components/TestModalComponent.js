
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import {
    testType,
} from '../../../utils/constants/filters';
import {
    defaultTestResults,
    testResults,
    pgTestResults,
} from '../../../utils/constants/testsResults';
import TimeSelect from '../../../components/TimeSelectComponent';
import ModalItem from './ModalItemComponent';
import CattCard from './CattCardComponent';

const selectPlaceholder = {
    id: 'main.label.selectOption',
    defaultMessage: 'Select an option',
};

const inputPlaceHolder = '--';

const dateFormat = 'DD-MM-YYYY';

const getAvailableTestTypes = (testTypes, currentCase) => {
    const testTypesList = [];
    testTypes.forEach((tt) => {
        const testTypeExist = Boolean(currentCase.tests.find(t => t.type === tt.value));
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
            currentCase: props.currentCase,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
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
        console.log('SAVE', currentTest);
    }

    getComponentValues() {
        const {
            currentCase,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            currentTest,
        } = this.state;
        const initValues = {};
        initValues.testTypeSelect = testType(
            formatMessage,
            {
                id: 'main.label.test_type_select',
                defaultMessage: 'Test type',
            },
            false,
        );
        initValues.saveDisabled = true;
        initValues.isNewTest = currentTest.id === 0;
        initValues.availableTestType = initValues.isNewTest
            ? getAvailableTestTypes(initValues.testTypeSelect.options, currentCase) : initValues.testTypeSelect.options;
        initValues.results = testResults;
        if (currentTest.type === 'PG') {
            initValues.results = pgTestResults;
        } else if (initValues.isNewTest) {
            initValues.results = defaultTestResults;
        }
        initValues.result = currentTest.result;
        if (initValues.result > 2) {
            initValues.result = 2;
        }
        return initValues;
    }


    render() {
        const {
            toggleModal,
            showModale,
            intl: {
                formatMessage,
            },
            // load: {
            //     loading,
            // },
        } = this.props;
        const {
            currentTest,
            currentCase,
        } = this.state;
        const {
            testTypeSelect,
            saveDisabled,
            isNewTest,
            availableTestType,
            results,
            result,
        } = this.getComponentValues();
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
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.testType"
                                    defaultMessage="Test type"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={testTypeSelect.isMultiSelect}
                                    clearable={testTypeSelect.isClearable}
                                    simpleValue
                                    value={currentTest.type}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={availableTestType}
                                    onChange={value => this.onChange('type', value, 'currentTest')}
                                />
                            )}
                        />
                        {
                            currentTest.type === 'CATT'
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage
                                            id="main.label.index"
                                            defaultMessage="Index"
                                        />
                                    )}
                                    fieldComponent={(
                                        <CattCard
                                            cattIndex={currentTest.index}
                                            onChange={newIndex => this.onChange('index', newIndex, 'currentTest')}
                                        />
                                    )}
                                />
                            )
                        }
                        <ModalItem
                            labelComponent={(
                                <Fragment>
                                    {
                                        currentTest.type && currentTest.type === 'PL'
                                        && <FormattedMessage id="patientsCasesTests.plResult" defaultMessage="Présence trypanosomes" />
                                    }
                                    {
                                        (!currentTest.type || (currentTest.type && currentTest.type !== 'PL'))
                                        && <FormattedMessage id="main.label.result" defaultMessage="Result" />
                                    }
                                </Fragment>
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable={false}
                                    simpleValue
                                    value={result}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={results.map(r => ({
                                        value: r.value,
                                        label: formatMessage(r.label),
                                    }))}
                                    onChange={value => this.onChange('result', value, 'currentTest')}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.date"
                                    defaultMessage="Date"
                                />
                            )}
                            fieldComponent={(
                                <div className="filter__container__select date-select">
                                    <DatePicker
                                        dateFormat={dateFormat}
                                        dateFormatCalendar="YYYY-MM-DD"
                                        selected={currentTest.date && moment(currentTest.date)}
                                        onChange={date => this.onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), 'currentTest')}
                                    />
                                </div>
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.time"
                                    defaultMessage="Time"
                                />
                            )}
                            fieldComponent={(
                                <TimeSelect
                                    dateTime={moment(currentTest.date)}
                                    onChange={date => this.onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), 'currentTest')}
                                />
                            )}
                        />
                        {
                            currentTest.type === 'PL'
                            && (
                                <Fragment>
                                    <ModalItem
                                        labelComponent={(
                                            <FormattedHTMLMessage
                                                id="patientsCasesTests.test_pl_gb_mm3"
                                                defaultMessage="White blood cells/mm&sup3;"
                                            />
                                        )}
                                        fieldComponent={(
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder={inputPlaceHolder}
                                                value={currentCase.test_pl_gb_mm3}
                                                onChange={event => this.onChange('test_pl_gb_mm3', event.currentTarget.value, 'currentCase')}
                                            />
                                        )}
                                    />
                                    <ModalItem
                                        labelComponent={(
                                            <FormattedMessage
                                                id="patientsCasesTests.test_pl_albumine"
                                                defaultMessage="Albumin"
                                            />
                                        )}
                                        fieldComponent={(
                                            <input
                                                type="text"
                                                placeholder={inputPlaceHolder}
                                                value={currentCase.test_pl_albumine}
                                                onChange={event => this.onChange('test_pl_albumine', event.currentTarget.value, 'currentCase')}
                                            />
                                        )}
                                    />
                                    <ModalItem
                                        labelComponent={(
                                            <FormattedMessage
                                                id="patientsCasesTests.test_pl_lcr"
                                                defaultMessage="LCR"
                                            />
                                        )}
                                        fieldComponent={(
                                            <input
                                                type="text"
                                                placeholder={inputPlaceHolder}
                                                value={currentCase.test_pl_lcr}
                                                onChange={event => this.onChange('test_pl_lcr', event.currentTarget.value, 'currentCase')}
                                            />
                                        )}
                                    />
                                </Fragment>
                            )
                        }
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.comments"
                                    defaultMessage="Comments"
                                />
                            )}
                            fieldComponent={(
                                <textarea
                                    value={currentCase.test_pl_comments}
                                    onChange={event => this.onChange('comment', event.currentTarget.value, 'currentTest')}
                                />
                            )}
                        />
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
        date: new Date(),
    },
};

TestModalComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    currentTest: PropTypes.object,
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
