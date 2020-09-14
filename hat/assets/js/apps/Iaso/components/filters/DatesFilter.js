import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import {
    FormControl,
} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(),
    },
    searchLabel: {
        paddingLeft: theme.spacing(4),
        paddingTop: 4,
    },
    label: {
        paddingTop: 4,
    },
    clearDateButton: {
        marginRight: theme.spacing(2),
        padding: 0,
        position: 'absolute',
        right: theme.spacing(5),
        top: 20,
    },
    input: {
        height: 38,
    },
}));

class PeriodSelectorComponent extends React.Component {
    constructor(props) {
        super(props);
        moment.locale('fr');
        this.state = {
            dateFrom: moment(props.dateFrom),
            dateTo: moment(props.dateTo),
            minDate: props.minDate !== '' ? moment(props.minDate) : null,
            dateFormat: 'YYYY-MM-DD',
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            dateFrom: moment(nextProps.dateFrom),
            dateTo: moment(nextProps.dateTo),
            minDate: nextProps.minDate !== '' ? moment(nextProps.minDate) : null,
        });
    }

    onChangeDate(key, value) {
        const newState = {
            ...this.state,
        };
        newState[key] = value;
        this.setState(newState);
        if (!this.props.showApplybutton) {
            this.props.onChangeDate(
                moment(newState.dateFrom).format(newState.dateFormat),
                moment(newState.dateTo).format(newState.dateFormat),
            );
        }
    }

    render() {
        const {
            dateFrom,
            dateTo,
        } = this.state;
        const classes = useStyles();
        return (
            <section className="date-select-container">
                <div className="filter__container__select date-select">

                    <FormControl className={classes.formControl}>
                        <KeyboardDatePicker
                            autoOk
                            disableToolbar
                            variant="inline"
                            InputLabelProps={{
                                className: classes.label,
                                shrink: Boolean(dateFrom),
                            }}
                            format="DD/MM/YYYY"
                            label="FRom"
                            helperText=""
                            InputProps={{
                                className: classes.input,
                            }}
                            value={dateFrom === '' ? null : dateFrom}
                            onChange={date => this.onChangeDate('dateFrom', moment(date))}
                            // onChange={newValue => setFilterValue(
                            //     filter.id,
                            //     newValue ? newValue.format('MM/DD/YYYY') : null,
                            // )
                            // }
                        />
                    </FormControl>
                </div>
                <div className="filter__container__select date-select">

                    <FormControl className={classes.formControl}>
                        <KeyboardDatePicker
                            autoOk
                            disableToolbar
                            variant="inline"
                            InputLabelProps={{
                                className: classes.label,
                                shrink: Boolean(dateTo),
                            }}
                            format="DD/MM/YYYY"
                            label="FRom"
                            helperText=""
                            InputProps={{
                                className: classes.input,
                            }}
                            value={dateTo === '' ? null : dateTo}
                            onChange={date => this.onChangeDate('dateFrom', moment(date))}
                            // onChange={newValue => setFilterValue(
                            //     filter.id,
                            //     newValue ? newValue.format('MM/DD/YYYY') : null,
                            // )
                            // }
                        />
                    </FormControl>
                </div>
                {
                    this.props.showApplybutton
                    && (
                        <button
                            onClick={() => this.props.onChangeDate(
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
                    )
                }
            </section>
        );
    }
}
PeriodSelectorComponent.defaultProps = {
    showApplybutton: true,
};

PeriodSelectorComponent.defaultProps = {
    minDate: '',
};

PeriodSelectorComponent.propTypes = {
    onChangeDate: PropTypes.func.isRequired,
    dateFrom: PropTypes.string.isRequired,
    dateTo: PropTypes.string.isRequired,
    minDate: PropTypes.string,
    showApplybutton: PropTypes.bool,
};

const PeriodSelectorComponentIntl = injectIntl(PeriodSelectorComponent);

export default PeriodSelectorComponentIntl;
