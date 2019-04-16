import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Select from 'react-select';
import moment from 'moment';
import PeriodSelectorComponent from './PeriodSelectorComponent';

const defaultDateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
const defaultDateTo = moment().format('YYYY-MM-DD');

class ChoosePeriodSelectorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            withPeriod: props.params.date_from !== undefined && props.params.date_to !== undefined,
            dateFrom: props.params.date_from || defaultDateFrom,
            dateTo: props.params.date_to || defaultDateTo,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            dateFrom: nextProps.params.date_from || defaultDateFrom,
            dateTo: nextProps.params.date_to || defaultDateTo,
        });
    }

    toggleDisplayPeriod(value) {
        this.setState({
            withPeriod: value,
        });
        const tempParams = {
            ...this.props.params,
        };
        if (value) {
            tempParams.date_from = this.state.dateFrom;
            tempParams.date_to = this.state.dateTo;
        } else {
            delete tempParams.date_from;
            delete tempParams.date_to;
        }
        this.props.redirectTo(this.props.baseUrl, {
            ...tempParams,
        });
    }

    render() {
        const {
            redirectTo,
            baseUrl,
        } = this.props;
        return (
            <div className={`widget__content--tier choose-period-container${this.state.withPeriod ? ' with-separation' : ''}`}>
                <div>
                    <Select
                        multi={false}
                        clearable={false}
                        simpleValue
                        name="periodSelector"
                        value={this.state.withPeriod}
                        options={[
                            { label: 'Sans choix de période (tous les résultats)', value: false },
                            { label: 'Avec choix de période', value: true },
                        ]}
                        onChange={value => this.toggleDisplayPeriod(value)}
                    />
                </div>
                {
                    this.state.withPeriod &&
                    <div className="three-tier">
                        <PeriodSelectorComponent
                            showApplybutton={this.props.showApplybutton}
                            dateFrom={this.state.dateFrom}
                            dateTo={this.state.dateTo}
                            onChangeDate={(dateFrom, dateTo) =>
                                redirectTo(baseUrl, {
                                    ...this.props.params,
                                    date_from: dateFrom,
                                    date_to: dateTo,
                                })}
                        />
                    </div>
                }
            </div>
        );
    }
}

ChoosePeriodSelectorComponent.defaultProps = {
    showApplybutton: true,
};


ChoosePeriodSelectorComponent.propTypes = {
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    baseUrl: PropTypes.string.isRequired,
    showApplybutton: PropTypes.bool,
};

const ChoosePeriodSelectorComponentIntl = injectIntl(ChoosePeriodSelectorComponent);

export default ChoosePeriodSelectorComponentIntl;
