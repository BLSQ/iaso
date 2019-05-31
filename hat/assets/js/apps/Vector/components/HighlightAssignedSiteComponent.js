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
                                defaultMessage: 'Mettre en avant les sites assignés à',
                            },
                            false,
                            'assignedToUser',
                            {
                                id: 'main.label.none',
                                defaultMessage: 'Aucun',
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
                                    defaultMessage="Assigné à "
                                />
                                {currentUserName}
                            </div>
                        </li>
                        <li>
                            <i className="map__option__icon--sites other" />
                            <div>
                                <FormattedMessage
                                    id="vector.label.assignedToOther"
                                    defaultMessage="Assigné à un autre utilisateur"
                                />
                            </div>
                        </li>
                        <li>
                            <i className="map__option__icon--sites not-assigned" />
                            <div>
                                <FormattedMessage
                                    id="vector.label.notAssigned"
                                    defaultMessage="Non assigné"
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
