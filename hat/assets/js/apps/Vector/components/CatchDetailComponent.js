import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import moment from 'moment';

class CatchDetailComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            catchItem: props.catch,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            catchItem: nextProps.catch,
        });
    }


    render() {
        const { catchItem } = this.state;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
                overlayClassName="transparent-overlay"
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.catch.title" defaultMessage="Déploiement" />
                </div>
                <section className="edit-modal large extra">
                    <section className="half-container">
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <th>UUID</th>
                                        <td className="small">
                                            {catchItem.uuid}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.creation"
                                                defaultMessage="Création"
                                            />
                                        </th>
                                        <td>
                                            {moment(catchItem.setup_date).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.collecte"
                                                defaultMessage="Dernière collecte"
                                            />
                                        </th>
                                        <td>
                                            {moment(catchItem.collect_date).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.latitude"
                                                defaultMessage="Latitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.latitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.longitude"
                                                defaultMessage="Longitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.longitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.altitude"
                                                defaultMessage="Altitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.altitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.accuracy"
                                                defaultMessage="Précision"
                                            />
                                        </th>
                                        <td>{catchItem.accuracy ? catchItem.accuracy : '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.male_count"
                                                defaultMessage="Mâles"
                                            />
                                        </th>
                                        <td>{catchItem.male_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.female_count"
                                                defaultMessage="Femelles"
                                            />
                                        </th>
                                        <td>{catchItem.female_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.unknown_count"
                                                defaultMessage="Inconnus"
                                            />
                                        </th>
                                        <td>{catchItem.unknown_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.remarks"
                                                defaultMessage="Remarque"
                                            />
                                        </th>
                                        <td>{catchItem.remarks}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.problem"
                                                defaultMessage="Problème"
                                            />
                                        </th>
                                        <td>{catchItem.problem}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.username"
                                                defaultMessage="Utilisateur"
                                            />
                                        </th>
                                        <td>{catchItem.username}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.source"
                                                defaultMessage="Source"
                                            />
                                        </th>
                                        <td>{catchItem.source}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}

CatchDetailComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    catch: PropTypes.object.isRequired,
};

export default CatchDetailComponent;
