import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

class DeviceEventForm extends React.Component {
    constructor() {
        super();
        this.state = {
        };
    }

    render() {
        return (
            <form method="post" action={`/sync/device_event_form/${this.props.deviceId}/`}>
                <div className="teamsdevices__event__field__title">Changer Statut</div>
                <select id="id_status" name="status">
                    <option value="" selected="selected">---------</option>
                    <option value="1">Problèmes de connexion</option>
                    <option value="2">Problème résolu</option>
                    <option value="3">Problème technique</option>
                </select>
                <button name="event_type" value="0">Envoyer</button>
                <div className="teamsdevices__event__field__title">Action</div>
                <select id="id_action" name="action">
                    <option value="" selected="selected">---------</option>
                    <option value="1">Utilisateur appelé</option>
                    <option value="2">Enquête de terrain</option>
                </select>
                <button name="event_type" value="1">Envoyer</button>
                <div className="teamsdevices__event__field__title">Ajouter commentaire</div>
                <textarea cols="40" id="id_comment" name="comment" rows="10" />
                <button name="event_type" value="2">Envoyer</button>
            </form>
        );
    }
}
const DeviceEventFormIntl = injectIntl(DeviceEventForm);

DeviceEventForm.propTypes = {
    deviceId: PropTypes.string.isRequired,
};


export default DeviceEventFormIntl;
