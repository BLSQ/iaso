import React from 'react';
import PropTypes from 'prop-types';
import {
    injectIntl,
    FormattedDate,
    FormattedMessage,
} from 'react-intl';

class DataTable extends React.Component {
    constructor() {
        super();
        this.state = {
        };
    }

    render() {
        return (

            <div className="widget__container" data-qa="monthly-report-data-loaded">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        <FormattedMessage id="teamsdevices.header.results" defaultMessage="Synchronisation des Appareils" />
                    </h2>
                </div>

                <div>
                    <table>
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Equipe</th>
                                <th>
                                    <FormattedMessage id="teamsdevices.last_sync" defaultMessage="Dernière Sync" />
                                </th>
                                <th>
                                    <FormattedMessage id="teamsdevices.days_ago" defaultMessage="Jours passés" />
                                </th>
                                <th>
                                    <FormattedMessage id="teamsdevices.sync_summary" defaultMessage="Total-Créé-Màj-Effacé" />
                                </th>

                                <th>
                                    <FormattedMessage id="teamsdevices.device_id" defaultMessage="Identifiant" />
                                </th>
                                <th>
                                    <FormattedMessage id="teamsdevices.status_audit" defaultMessage="Statut Audit" />
                                </th>
                                <th>
                                    <span />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.props.data.device_status.map((status, i) => {
                                let daysClass = 'ok';
                                let daysString;
                                if (status.days_since_sync < 0) {
                                    daysString = 'Jamais Synchronisé';
                                } else {
                                    daysString = status.days_since_sync;
                                }

                                if (status.days_since_sync > 40) {
                                    daysClass = 'error';
                                }
                                if (status.days_since_sync > 20) {
                                    daysClass = 'warning';
                                }

                                return (
                                    <tr key={`index-${status.id}`}>
                                        <td>{status.last_user}</td>
                                        <td>{status.last_team}</td>
                                        <td>
                                            <FormattedDate
                                                value={new Date(status.last_synced_date)}
                                            />
                                        </td>
                                        <td className={daysClass}>{daysString}</td>
                                        <td>{status.last_synced_log_message}</td>
                                        <td>{status.device_id}</td>
                                        <td>
                                            <a
                                                tabIndex={0}
                                                role="button"
                                                className="pointerClick"
                                                onClick={(e) => {
                                                    this.props.auditClickHandler(e, status.id);
                                                }}
                                            >
                                                {status.last_status !== '' ? status.last_status : 'Editer'}
                                            </a>
                                        </td>
                                        <td>
                                            <a
                                                tabIndex={0}
                                                role="button"
                                                className="pointerClick"
                                                onClick={(e) => {
                                                    this.props.moreClickHandler(e, status.id);
                                                }}
                                            >
                                                Historique
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
const DataTableIntl = injectIntl(DataTable);

DataTable.propTypes = {
    data: PropTypes.object.isRequired,
    auditClickHandler: PropTypes.func.isRequired,
    moreClickHandler: PropTypes.func.isRequired,
};


export default DataTableIntl;
