
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
import TestLocationComponent from './TestLocationComponent';
import ModalItem from '../../../components/ModalItemComponent';
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

    return initValues;
};

const TestInfoComponent = ({
    intl: {
        formatMessage,
    },
    profiles,
    onChange,
    currentTest,
    currentCase,
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
                                    className={!currentTest.type ? 'form-error' : null}
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
                                            className={!result ? 'form-error' : null}
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
                                            className={!currentTest.clinicalsigns
                                                || (currentTest.clinicalsigns && currentTest.clinicalsigns.length === 0)
                                                ? 'form-error' : null}
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
                                        onChange={date => onChange('date', moment(date).format('YYYY-MM-DDTHH:mmZ'), 'currentTest')}
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
                                    onChange={date => onChange('date', moment(date).format('YYYY-MM-DDTHH:mmZ'), 'currentTest')}
                                />
                            )}
                        />
                        {
                            currentTest.type === 'CATT'
                            && Boolean(result)
                            && result > -1
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
                                            isRequired
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
                                            <Fragment>
                                                <input
                                                    className={!currentCase.test_pl_gb_mm3 ? 'form-error' : null}
                                                    type="number"
                                                    min={0}
                                                    placeholder={inputPlaceHolder}
                                                    value={currentCase.test_pl_gb_mm3 || inputPlaceHolder}
                                                    onChange={event => onChange('test_pl_gb_mm3', event.currentTarget.value, 'currentCase')}
                                                />
                                                {
                                                    currentCase.test_pl_result && (
                                                        <span className="inline-infos">
                                                            <FormattedMessage id="main.label.stage" defaultMessage="Stage" />
                                                            {' '}
                                                            {
                                                                currentCase.test_pl_result === 'stage1' ? '1' : ''
                                                            }
                                                            {
                                                                currentCase.test_pl_result === 'stage2' ? '2' : ''
                                                            }
                                                            {
                                                                currentCase.test_pl_result === 'unknown'
                                                                    ? <FormattedMessage id="main.label.unknown" defaultMessage="Inconnu" /> : ''
                                                            }
                                                        </span>
                                                    )
                                                }
                                            </Fragment>
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
                                                value={currentCase.test_pl_albumine || inputPlaceHolder}
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
                                                value={currentCase.test_pl_lcr || inputPlaceHolder}
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

                        <TestLocationComponent
                            onChange={(key, value, type) => onChange(key, value, type)}
                        />
                    </Grid>
                </Grid>
            </section>
        </Fragment>
    );
};

TestInfoComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentCase: PropTypes.object.isRequired,
    currentTest: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
    profiles: state.profiles.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TestInfoComponent));
