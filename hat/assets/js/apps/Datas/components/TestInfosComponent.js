
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import {
    testType,
} from '../../../utils/constants/filters';
import clinicalSigns from '../../../utils/constants/clinicalSigns';
import {
    defaultTestResults,
    testResults,
    pgTestResults,
} from '../../../utils/constants/testsResults';

import TimeSelect from '../../../components/TimeSelectComponent';
import ModalItem from './ModalItemComponent';
import CattCard from './CattCardComponent';
import CheckBox from '../../../components/CheckBoxComponent';
import getDisplayName from '../../../utils/profilesUtils';

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

const getComponentValues = (
    currentCase,
    currentTest,
    formatMessage,
    currentUser,
) => {
    const initValues = {};
    initValues.testTypeSelect = testType(
        formatMessage,
        {
            id: 'main.label.test_type_select',
            defaultMessage: 'Test type',
        },
        false,
    );
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
    initValues.tester = currentTest.tester;
    // if (initValues.isNewTest && !initValues.tester) {
    //     initValues.tester = currentUser ? currentUser.id : null;
    // }

    return initValues;
};

// TO_DO =  village, Validation
const TestInfoComponent = ({
    intl: {
        formatMessage,
    },
    profiles,
    onChange,
    currentTest,
    currentCase,
    currentUser,
}) => {
    const {
        testTypeSelect,
        availableTestType,
        results,
        result,
        tester,
    } = getComponentValues(
        currentCase,
        currentTest,
        formatMessage,
        currentUser,
    );
    return (
        <Fragment>
            <section className="large-modal-content">
                <Grid container spacing={0} className="margin-bottom">
                    <Grid
                        xs={6}
                        item
                        container
                        justify="flex-end"
                        alignContent="flex-start"
                    >
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
                                    onChange={value => onChange('type', value, 'currentTest')}
                                />
                            )}
                        />
                        {
                            currentTest.type !== 'clinicalsigns'
                            && (
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
                                            onChange={value => onChange('result', value, 'currentTest')}
                                        />
                                    )}
                                />
                            )
                        }
                        {
                            currentTest.type === 'clinicalsigns'
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage
                                            id="main.label.test.clinicalsigns"
                                            defaultMessage="Clinical signs"
                                        />
                                    )}
                                    fieldComponent={(
                                        <Select
                                            multi
                                            clearable
                                            multiValue
                                            value={currentTest.clinicalsigns}
                                            placeholder={formatMessage(selectPlaceholder)}
                                            options={clinicalSigns.map(c => ({
                                                value: c.key,
                                                label: formatMessage(c.label),
                                            }))}
                                            onChange={value => onChange('clinicalsigns', value, 'currentTest')}
                                        />
                                    )}
                                />
                            )
                        }
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.test.tester"
                                    defaultMessage="Tester"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable={false}
                                    simpleValue
                                    value={tester}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={profiles.map(p => ({
                                        value: p.id,
                                        label: getDisplayName(p),
                                    }))}
                                    onChange={value => onChange('tester', value, 'currentTest')}
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
                                    alignItems="flex-start"
                                    fieldComponent={(
                                        <CattCard
                                            cattIndex={currentTest.index}
                                            onChange={newIndex => onChange('index', newIndex, 'currentTest')}
                                        />
                                    )}
                                />
                            )
                        }
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
                                                onChange={event => onChange('test_pl_gb_mm3', event.currentTarget.value, 'currentCase')}
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
                                                onChange={event => onChange('test_pl_albumine', event.currentTarget.value, 'currentCase')}
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
                                                onChange={event => onChange('test_pl_lcr', event.currentTarget.value, 'currentCase')}
                                            />
                                        )}
                                    />
                                </Fragment>
                            )
                        }
                    </Grid>
                    <Grid
                        xs={6}
                        item
                        container
                        justify="flex-end"
                        alignContent="flex-start"
                    >
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
                                        onChange={date => onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), 'currentTest')}
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
                                    onChange={date => onChange('date', moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSZ'), 'currentTest')}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.comments"
                                    defaultMessage="Comments"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    value={currentTest.comment || ''}
                                    onChange={event => onChange('comment', event.currentTarget.value, 'currentTest')}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.hidden"
                                    defaultMessage="Hidden"
                                />
                            )}
                            fieldComponent={(
                                <CheckBox
                                    isChecked={currentTest.hidden}
                                    keyValue="hidden"
                                    toggleCheckbox={isChecked => onChange('hidden', isChecked, 'currentTest')}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </section>
        </Fragment>
    );
};

TestInfoComponent.defaultProps = {
    currentTest: {
        id: 0,
        date: new Date(),
    },
};

TestInfoComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentCase: PropTypes.object.isRequired,
    currentTest: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    profiles: PropTypes.array.isRequired,
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
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TestInfoComponent));
