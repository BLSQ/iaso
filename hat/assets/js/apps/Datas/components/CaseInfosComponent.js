
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';

import {
    screeningType,
    stage,
    source,
} from '../../../utils/constants/filters';
import ModalItem from './ModalItemComponent';
import { getYears } from '../../../utils/index';
import { getDeviceMessage } from '../utils';
import DeviceTooltip from '../../../components/DeviceTooltip';

import TimeSelect from '../../../components/TimeSelectComponent';

const selectPlaceholder = {
    id: 'main.label.selectOption',
    defaultMessage: 'Select an option',
};

const inputPlaceHolder = '--';
const dateFormat = 'DD-MM-YYYY';

const CaseInfosComponent = ({
    intl: {
        formatMessage,
    },
    teams,
    devices,
    onChange,
    currentCase,
}) => {
    const years = getYears(30);
    return (
        <Fragment>
            <section className="large-modal-content">
                <Grid container spacing={1} className="margin-bottom">
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
                                        selected={currentCase.document_date && moment(currentCase.document_date)}
                                        onChange={date => onChange('document_date', moment(date).format('YYYY-MM-DD HH:mmZ'))}
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
                                    dateTime={moment(currentCase.document_date)}
                                    onChange={date => onChange('document_date', moment(date).format('YYYY-MM-DD HH:mmZ'))}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.screening_type"
                                    defaultMessage="Screening type"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    className={!currentCase.screening_type ? 'form-error' : null}
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={currentCase.screening_type}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={screeningType(formatMessage).options}
                                    onChange={value => onChange('screening_type', value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.stage"
                                    defaultMessage="Stage"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={currentCase.test_pl_result}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={stage(formatMessage).options}
                                    onChange={value => onChange('test_pl_result', value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.team"
                                    defaultMessage="Team"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={
                                        currentCase.team
                                        && currentCase.team.normalized_team
                                        && currentCase.team.normalized_team.id}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={teams.map(t => ({
                                        value: t.id,
                                        label: t.name,
                                    }))}
                                    onChange={value => onChange('team', value, 'normalized_team', 'id')}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.form_number"
                                    defaultMessage="Form number"
                                />
                            )}
                            fieldComponent={(
                                <input
                                    type="number"
                                    min={0}
                                    placeholder={inputPlaceHolder}
                                    value={currentCase.form_number || inputPlaceHolder}
                                    onChange={event => onChange('form_number', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.form_year"
                                    defaultMessage="Fom year"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={currentCase.form_year}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={years.map(y => ({
                                        value: y,
                                        label: y,
                                    }))}
                                    onChange={value => onChange('form_year', value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.source"
                                    defaultMessage="Source"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={currentCase.source}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    options={source(formatMessage).options}
                                    onChange={value => onChange('source', value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.devices"
                                    defaultMessage="Device"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    multi={false}
                                    clearable
                                    simpleValue
                                    value={currentCase.device_id}
                                    placeholder={formatMessage(selectPlaceholder)}
                                    optionComponent={DeviceTooltip}
                                    options={devices.map(d => ({
                                        label: getDeviceMessage(d),
                                        value: d.device_id,
                                        device: d,
                                    }))}
                                    onChange={value => onChange('device_id', value)}
                                />
                            )}
                        />
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
                                    id="patientsCases.circumstances_da_um"
                                    defaultMessage="UM active screening"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    className="small"
                                    value={currentCase.circumstances_da_um || ''}
                                    onChange={event => onChange('circumstances_da_um', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="patientsCases.circumstances_dp_um"
                                    defaultMessage="UM passive screening"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    className="small"
                                    value={currentCase.circumstances_dp_um || ''}
                                    onChange={event => onChange('circumstances_dp_um', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="patientsCases.circumstances_dp_cdtc"
                                    defaultMessage="Passive screening CDTC"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    className="small"
                                    value={currentCase.circumstances_dp_cdtc || ''}
                                    onChange={event => onChange('circumstances_dp_cdtc', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="patientsCases.circumstances_dp_cs"
                                    defaultMessage="CS passive screening"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    className="small"
                                    value={currentCase.circumstances_dp_cs || ''}
                                    onChange={event => onChange('circumstances_dp_cs', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="patientsCases.circumstances_dp_hgr"
                                    defaultMessage="HGR passive screening"
                                />
                            )}
                            alignItems="flex-start"
                            fieldComponent={(
                                <textarea
                                    className="small"
                                    value={currentCase.circumstances_dp_hgr || ''}
                                    onChange={event => onChange('circumstances_dp_hgr', event.currentTarget.value)}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </section>
        </Fragment>
    );
};


CaseInfosComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentCase: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    teams: PropTypes.array.isRequired,
    devices: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    deleteResult: state.cases.deleteResult,
    deleteError: state.cases.deleteError,
    teams: state.patientsFilters.teams,
    devices: state.patientsFilters.devices,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(CaseInfosComponent));
