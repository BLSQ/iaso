import React from 'react';
import superagent from 'superagent';
import PropTypes from 'prop-types';
import {
    FormattedDate,
    injectIntl,
} from 'react-intl';

class DeviceEventsList extends React.Component {
    constructor() {
        super();
        this.state = {
            data: [],
        };
    }

    componentDidMount() {
        const that = this;
        const url = `/api/datasets/device_events/?device_id=${this.props.deviceId}`;
        superagent.get(url).end((err, res) => {
            if (err) {
                console.log('error accessing url ', url, err);
                return;
            }

            that.setState({
                data: res.body,
            });
        });
    }

    render() {
        return (
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>User</th>
                    </tr>
                </thead>
                <tbody>{
                    this.state.data.map((event, i) => {
                        let eventType;
                        let eventLabel;
                        if (event.event_type === 0) {
                            eventType = 'Status';
                            eventLabel = event.status__label;
                        }

                        if (event.event_type === 1) {
                            eventType = 'Action';
                            eventLabel = event.action__label;
                        }
                        if (event.event_type === 2) {
                            eventType = 'Comment';
                            eventLabel = event.comment;
                        }
                        return (
                            <tr>
                                <td>{eventType}</td>
                                <td>{eventLabel}</td>
                                <td><FormattedDate value={new Date(event.date)} /></td>
                                <td>{event.reporter__username}</td>
                            </tr>
                        );
                    })
                }
                </tbody>
            </table>
        );
    }
}
const DeviceEventsListIntl = injectIntl(DeviceEventsList);

DeviceEventsList.propTypes = {
    deviceId: PropTypes.string.isRequired,
};


export default DeviceEventsListIntl;
