
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import {
    Grid,
} from '@material-ui/core';


import ModalItem from './ModalItemComponent';
import NullBooleanRadio from '../../../components/NullBooleanRadio';
import { capitalize } from '../../../utils';
import { getDeviceMessage } from '../utils';
import DeviceTooltip from '../../../components/DeviceTooltip';

const selectPlaceholder = {
    id: 'main.label.selectOption',
    defaultMessage: 'Select an option',
};

const dateFormat = 'DD-MM-YYYY';

const TreatmentInfosComponent = ({
    intl: {
        formatMessage,
    },
    onChange,
    currentTreatment,
    treatmentChoices,
    devices,
}) => {
    const onChangeDevice = (deviceId) => {
        const device = devices.find(d => d.device_id === deviceId);
        onChange('device', device);
    };
    return (
        <Grid container spacing={0} className="margin-bottom">
            <Grid
                xs={12}
                item
                container
                justify="flex-end"
                alignContent="flex-start"
            >
                <ModalItem
                    labelComponent={(
                        <FormattedMessage
                            id="patient.treatment.start_date"
                            defaultMessage="Start date"
                        />
                    )}
                    fieldComponent={(
                        <div className={`filter__container__select date-select${!currentTreatment.start_date ? ' form-error' : ''}`}>
                            <DatePicker
                                dateFormat={dateFormat}
                                maxDate={currentTreatment.end_date && moment(currentTreatment.end_date)}
                                dateFormatCalendar="YYYY-MM-DD"
                                selected={currentTreatment.start_date && moment(currentTreatment.start_date)}
                                onChange={date => onChange('start_date', moment(date).format('YYYY-MM-DD'))}
                            />
                        </div>
                    )}
                />
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.complete" defaultMessage="Complete" />
                    )}
                    fieldComponent={(
                        <NullBooleanRadio
                            keyName="complete"
                            value={currentTreatment.complete}
                            onChange={newValue => onChange('complete', newValue)}
                        />
                    )}
                />
                {
                    currentTreatment.complete
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage
                                            id="patient.treatment.end_date"
                                            defaultMessage="End date"
                                        />
                                    )}
                                    fieldComponent={(
                                        <div className={`filter__container__select date-select${!currentTreatment.end_date ? ' form-error' : ''}`}>
                                            <DatePicker
                                                minDate={currentTreatment.start_date && moment(currentTreatment.start_date)}
                                                dateFormat={dateFormat}
                                                dateFormatCalendar="YYYY-MM-DD"
                                                selected={currentTreatment.end_date && moment(currentTreatment.end_date)}
                                                onChange={date => onChange('end_date', moment(date).format('YYYY-MM-DD'))}
                                            />
                                        </div>
                                    )}
                                />
                            )
                }
                {
                    currentTreatment.complete === false
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage id="patient.treatment.incomplete_reasons" defaultMessage="Incomplete reason" />
                                    )}
                                    fieldComponent={(
                                        <Select
                                            className={!currentTreatment.incomplete_reasons ? 'form-error' : null}
                                            multi
                                            clearable
                                            simpleValue
                                            value={currentTreatment.incomplete_reasons}
                                            placeholder={formatMessage(selectPlaceholder)}
                                            options={treatmentChoices.incompleteReasonsChoices
                                                .map(i => ({
                                                    label: capitalize(i[1]),
                                                    value: i[0],
                                                }))}
                                            onChange={value => onChange('incomplete_reasons', value)}
                                        />
                                    )}
                                />
                            )
                }
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.medicine" defaultMessage="Medicine" />
                    )}
                    fieldComponent={(
                        <Select
                            className={!currentTreatment.medicine ? 'form-error' : null}
                            multi={false}
                            clearable={false}
                            simpleValue
                            value={currentTreatment.medicine}
                            placeholder={formatMessage(selectPlaceholder)}
                            options={treatmentChoices.medChoices
                                .filter(med => med[0] !== 'none')
                                .map(med => ({
                                    label: capitalize(med[1]),
                                    value: med[0],
                                }))}
                            onChange={value => onChange('medicine', value)}
                        />
                    )}
                />
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.success" defaultMessage="Success" />
                    )}
                    fieldComponent={(
                        <NullBooleanRadio
                            keyName="success"
                            value={currentTreatment.success}
                            onChange={newValue => onChange('success', newValue)}
                        />
                    )}
                />
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.dead" defaultMessage="dead" />
                    )}
                    fieldComponent={(
                        <NullBooleanRadio
                            keyName="dead"
                            value={currentTreatment.dead}
                            onChange={newValue => onChange('dead', newValue)}
                        />
                    )}
                />
                {
                    currentTreatment.dead
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage id="patient.treatment.deathMoment" defaultMessage="Death" />
                                    )}
                                    fieldComponent={(
                                        <Select
                                            className={currentTreatment.dead && !currentTreatment.death_moment ? 'form-error' : null}
                                            multi={false}
                                            clearable={false}
                                            simpleValue
                                            value={currentTreatment.death_moment}
                                            placeholder={formatMessage(selectPlaceholder)}
                                            options={treatmentChoices.deathMomentChoices
                                                .map(i => ({
                                                    label: capitalize(i[1]),
                                                    value: i[0],
                                                }))}
                                            onChange={value => onChange('death_moment', value)}
                                        />
                                    )}
                                />
                            )
                }
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.lost" defaultMessage="Lost" />
                    )}
                    fieldComponent={(
                        <NullBooleanRadio
                            keyName="lost"
                            value={currentTreatment.lost}
                            onChange={newValue => onChange('lost', newValue)}
                        />
                    )}
                />
                <ModalItem
                    labelComponent={(
                        <FormattedMessage id="patient.treatment.issues" defaultMessage="Events" />
                    )}
                    fieldComponent={(
                        <Select
                            multi
                            clearable
                            simpleValue
                            value={currentTreatment.issues}
                            placeholder={formatMessage(selectPlaceholder)}
                            options={treatmentChoices.issueChoices
                                .map(i => ({
                                    label: capitalize(i[1]),
                                    value: i[0],
                                }))}
                            onChange={value => onChange('issues', value)}
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
                            value={currentTreatment.device ? currentTreatment.device.device_id : null}
                            placeholder={formatMessage(selectPlaceholder)}
                            optionComponent={DeviceTooltip}
                            options={devices.map(d => ({
                                label: getDeviceMessage(d),
                                value: d.device_id,
                                device: d,
                            }))}
                            onChange={value => onChangeDevice(value)}
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
};

TreatmentInfosComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    currentTreatment: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    treatmentChoices: PropTypes.object.isRequired,
    devices: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    treatmentChoices: state.patients.treatmentChoices,
    devices: state.patientsFilters.devices,
});
const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(TreatmentInfosComponent));
