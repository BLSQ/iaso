import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FiltersComponent from '../../../components/FiltersComponent';
import { users } from '../../../utils/constants/filters';

class HighlightAssignedSiteComponent extends PureComponent {
    render() {
        const {
            profiles,
            baseUrl,
            params,
        } = this.props;
        let currentUserName = '';
        if (params.assignedToUser) {
            const currentUser = profiles.find(p => p.user__id === parseInt(params.assignedToUser, 10));
            currentUserName = currentUser ? currentUser.user__username : '';
        }
        return (
            <div className="margin-top">
                <FiltersComponent
                    params={this.props.params}
                    baseUrl={baseUrl}
                    filters={[
                        users(
                            profiles
                            , {
                                id: 'vector.label.assignedToUser',
                                defaultMessage: 'Highlight sites assigned to',
                            },
                            false,
                            'assignedToUser',
                            {
                                id: 'main.label.none',
                                defaultMessage: 'None',
                            },
                        ),
                    ]}
                />
                {
                    params.assignedToUser &&
                    <ul className="assignation-legend">
                        <li>
                            <i className="map__option__icon--sites current" />
                            <div>
                                <FormattedMessage
                                    id="vector.label.assignedToCurrent"
                                    defaultMessage="Assinged to"
                                />
                                {currentUserName}
                            </div>
                        </li>
                        <li>
                            <i className="map__option__icon--sites other" />
                            <div>
                                <FormattedMessage
                                    id="vector.label.assignedToOther"
                                    defaultMessage="Assigned to another user"
                                />
                            </div>
                        </li>
                        <li>
                            <i className="map__option__icon--sites not-assigned" />
                            <div>
                                <FormattedMessage
                                    id="vector.label.notAssigned"
                                    defaultMessage="Not assigned"
                                />
                            </div>
                        </li>
                    </ul>
                }
            </div>
        );
    }
}

HighlightAssignedSiteComponent.propTypes = {
    profiles: PropTypes.array.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string.isRequired,
};

export default HighlightAssignedSiteComponent;
