import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import DatePicker from 'react-datepicker';
import DatePickerStyles from 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';


class PeriodSelectorComponent extends React.Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            dateFrom: moment(props.dateFrom),
            dateTo: moment(props.dateTo),
            dateFormat: 'YYYY-MM-DD',
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            dateFrom: moment(nextProps.dateFrom),
            dateTo: moment(nextProps.dateTo),
        });
    }

    render() {
        return (
            <section className="date-select-container">
                <div className="filter__container__select date-select">
                    <label
                        htmlFor="date-from"
                        className="filter__container__select__label"
                    >
                        <i className="fa fa-calendar" />
                        <FormattedMessage
                            id="statspage.label.datefrom"
                            defaultMessage="From"
                        />
                    </label>
                    <DatePicker
                        dateFormat={this.state.dateFormat}
                        dateFormatCalendar={this.state.dateFormat}
                        selected={this.state.dateFrom}
                        onChange={date =>
                            this.setState({
                                dateFrom: moment(date),
                            })}
                        maxDate={this.state.dateTo}
                    />
                </div>
                <div className="filter__container__select date-select">
                    <label
                        htmlFor="date-to"
                        className="filter__container__select__label"
                    >
                        <i className="fa fa-calendar" />
                        <FormattedMessage
                            id="statspage.label.dateto"
                            defaultMessage="To"
                        />
                    </label>
                    <DatePicker
                        dateFormat={this.state.dateFormat}
                        dateFormatCalendar={this.state.dateFormat}
                        selected={this.state.dateTo}
                        minDate={this.state.dateFrom}
                        onChange={date =>
                            this.setState({
                                dateTo: moment(date),
                            })}
                    />
                </div>
                <button
                    onClick={() =>
                        this.props.onChangeDate(
                            moment(this.state.dateFrom).format(this.state.dateFormat),
                            moment(this.state.dateTo).format(this.state.dateFormat),
                        )}
                    className="button--save--tiny"
                >
                    <FormattedMessage
                        id="PeriodSelectorComponent.label.apply"
                        defaultMessage="Appliquer"
                    />
                </button>
            </section>
        );
    }
}


PeriodSelectorComponent.propTypes = {
    onChangeDate: PropTypes.func.isRequired,
    dateFrom: PropTypes.string.isRequired,
    dateTo: PropTypes.string.isRequired,
};

const PeriodSelectorComponentIntl = injectIntl(PeriodSelectorComponent);

export default PeriodSelectorComponentIntl;
