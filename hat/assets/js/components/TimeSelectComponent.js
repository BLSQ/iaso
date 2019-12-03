import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import moment from 'moment';
import TextField from '@material-ui/core/TextField';

class TimeSelectComponent extends Component {
    onChange(time) {
        const {
            onChange,
            dateTime,
        } = this.props;
        const newDateTime = dateTime.toDate();
        const hours = time.split(':')[0];
        const minutes = time.split(':')[1];
        newDateTime.setHours(hours);
        newDateTime.setMinutes(minutes);
        if (moment(newDateTime).isValid()) {
            onChange(newDateTime);
        }
    }

    render() {
        const {
            dateTime,
        } = this.props;
        const hours = moment(dateTime).format('HH');
        const minutes = moment(dateTime).format('mm');
        return (
            <div>
                <TextField
                    variant="outlined"
                    id="time"
                    label=""
                    type="time"
                    value={`${hours}:${minutes}`}
                    onChange={event => this.onChange(event.currentTarget.value)}
                    inputProps={{
                        step: 60,
                    }}
                />
            </div>
        );
    }
}

TimeSelectComponent.defaultProps = {
    dateTime: moment(),
};

TimeSelectComponent.propTypes = {
    dateTime: PropTypes.object,
    onChange: PropTypes.func.isRequired,
};

export default injectIntl(TimeSelectComponent);
