import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';
import ReactModal from 'react-modal';
import {
    Grid,
} from '@material-ui/core';

import CheckBox from '../../../components/CheckBoxComponent';
import ModalItem from '../../../components/ModalItemComponent';
import { getYears } from '../../../utils';
import { MONTHS_MESSAGES } from '../constants/monthsMessages';

class PlanningModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            planning: props.planning,
            isChanged: false,
            duplicateName: props.isDuplicate ? props.planning.name : null,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            duplicateName: nextProps.isDuplicate ? nextProps.planning.name : null,
        };
        if (!nextProps.isUpdating) {
            newState.showModale = nextProps.showModale;
            newState.planning = nextProps.planning;
            if (nextProps.isDuplicate) {
                newState.planning.year = '';
            }
            newState.isChanged = false;
        }
        this.setState(newState);
    }

    updatePlanningField(key, value) {
        const {
            planning,
        } = this.state;
        this.setState({
            planning: {
                ...planning,
                [key]: value,
            },
            isChanged: true,
        });
    }

    isSaveDisabled() {
        const {
            planning,
            isChanged,
        } = this.state;
        return (
            planning.name === ''
            || planning.year === ''
            || (planning.years && planning.years.length === 0)
            || planning.months === ''
            || planning.months < 0
            || (!isChanged && planning.id !== 0)
        );
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            planning,
            showModale,
            duplicateName,
        } = this.state;
        const possibleYears = getYears(10);
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="medium-modal-content">
                    {
                        this.props.isDuplicate
                        && (
                            <div className="subtitle">
                                <FormattedMessage id="main.management.planning.duplicate" defaultMessage="Copy of planning" />
:
                                {' '}
                                {duplicateName}
                            </div>
                        )
                    }

                    <Grid container spacing={1} className="margin-bottom">
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.label.name"
                                    defaultMessage="Name"
                                />
                            )}
                            fieldComponent={(
                                <input
                                    type="text"
                                    name="name"
                                    id={`name-${planning.id}`}
                                    value={planning.name}
                                    className={(!planning.name || planning.name === '') ? 'form-error' : ''}
                                    onChange={event => this.updatePlanningField('name', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.management.planning.yearOfApplication"
                                    defaultMessage="Year of application"
                                />
                            )}
                            fieldComponent={(
                                <input
                                    disabled={planning.is_template && !this.props.isDuplicate}
                                    type="number"
                                    name="year"
                                    id={`year-${planning.id}`}
                                    value={planning.year}
                                    className={(!planning.year || planning.year === '') ? 'form-error' : ''}
                                    onChange={event => this.updatePlanningField('year', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.management.planning.yearsCoverage"
                                    defaultMessage="Years coverage"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    disabled={planning.is_template && !this.props.isDuplicate}
                                    multi
                                    clearable={false}
                                    simpleValue
                                    autosize={false}
                                    name="years-coverage"
                                    id={`years-coverage-${planning.id}`}
                                    value={planning.years_coverage}
                                    placeholder={formatMessage({
                                        defaultMessage: 'Select years',
                                        id: 'microplanning.labels.years.select',
                                    })}
                                    options={possibleYears.map(year => ({ label: year, value: year }))}
                                    onChange={yearsList => this.updatePlanningField('years_coverage', yearsList.split(','))}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.management.planning.months"
                                    defaultMessage="Amount of months"
                                />
                            )}
                            fieldComponent={(
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder=""
                                    name="months"
                                    className={`small ${(!planning.months || planning.months === '') ? 'form-error' : ''}`}
                                    id={`months-${planning.id}`}
                                    value={planning.months || ''}
                                    onChange={event => this.updatePlanningField('months', event.currentTarget.value)}
                                />
                            )}
                        />
                        <ModalItem
                            labelComponent={(
                                <FormattedMessage
                                    id="main.management.planning.startingMonth"
                                    defaultMessage="Starting month"
                                />
                            )}
                            fieldComponent={(
                                <Select
                                    disabled={planning.is_template && !this.props.isDuplicate}
                                    multi={false}
                                    clearable={false}
                                    simpleValue
                                    autosize={false}
                                    name="month-start"
                                    id={`years-coverage-${planning.id}`}
                                    value={planning.month_start}
                                    placeholder={formatMessage({
                                        defaultMessage: 'Select a month',
                                        id: 'microplanning.labels.month.select',
                                    })}
                                    options={MONTHS_MESSAGES.map((m, i) => (
                                        {
                                            label: formatMessage(MONTHS_MESSAGES[i]),
                                            value: i + 1,
                                        }
                                    ))}
                                    onChange={month => this.updatePlanningField('month_start', month)}
                                />
                            )}
                        />
                        {
                            this.props.canMakeTemplate && !this.props.isDuplicate
                            && (
                                <ModalItem
                                    labelComponent={(
                                        <FormattedMessage
                                            id="main.label.template"
                                            defaultMessage="Template"
                                        />
                                    )}
                                    fieldComponent={(
                                        <CheckBox
                                            isChecked={planning.is_template}
                                            keyValue="make-template"
                                            labelClassName="filter__container__select__label"
                                            showSemicolon
                                            toggleCheckbox={() => this.updatePlanningField('is_template', !planning.is_template)}
                                        />
                                    )}
                                />
                            )}
                    </Grid>
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                        </button>
                        <button
                            disabled={this.isSaveDisabled()}
                            className="button margin-left"
                            onClick={() => (this.props.isDuplicate ? this.props.duplicatePlanning(planning) : this.props.savePlanning(this.state.planning))}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="management.label.savePlanning" defaultMessage="Save planning" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
PlanningModale.defaultProps = {
    planning: {
        id: 0,
        name: '',
        year: '',
    },
    canMakeTemplate: false,
};
PlanningModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    planning: PropTypes.object,
    savePlanning: PropTypes.func.isRequired,
    duplicatePlanning: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool.isRequired,
    isDuplicate: PropTypes.bool.isRequired,
    canMakeTemplate: PropTypes.bool,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(PlanningModale);
