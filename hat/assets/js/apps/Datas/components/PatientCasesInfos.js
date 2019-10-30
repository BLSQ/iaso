import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

const MESSAGES = {
    positive: {
        defaultMessage: 'Positive',
        id: 'main.label.positive',
    },
    negative: {
        defaultMessage: 'Negative',
        id: 'main.label.negative',
    },
    mobile_sync: {
        defaultMessage: 'Tablet sync',
        id: 'main.label.mobile_sync',
    },
    mobile_backup: {
        defaultMessage: 'Tablet back up',
        id: 'main.label.mobile_backup',
    },
    historic: {
        defaultMessage: 'Historic',
        id: 'main.label.historic',
    },
    pv: {
        defaultMessage: 'Pharmacovigilance',
        id: 'main.label.pv',
    },
};

const getTeamName = (currentCase) => {
    let teamName = '--';
    if (currentCase.team.normalized_team) {
        teamName = currentCase.team.normalized_team.name;
    }
    if (!currentCase.team.normalized_team && currentCase.mobile_unit) {
        teamName = currentCase.mobile_unit;
    }
    return teamName;
};

class PatientCasesInfo extends React.Component {
    render() {
        const { currentCase, similarCase } = this.props;
        if (!currentCase) {
            return null;
        }
        const { formatMessage } = this.props.intl;
        const teamName = getTeamName(currentCase);
        let duplicateTeamName = teamName;
        if (similarCase) {
            duplicateTeamName = getTeamName(similarCase);
        }
        return (
            <div className="patient-infos-container no-padding-left no-padding-top">
                <table
                    key={currentCase.id}
                    className={!currentCase.team.normalized_team ? 'error-table' : ''}
                >
                    <thead className="custom-head">
                        <tr
                            className={!currentCase.team.normalized_team ? 'error' : ''}
                        >
                            <th colSpan="2">
                                {
                                    !currentCase.team.normalized_team
                                    && (
                                        <span>
                                            <i className="fa fa-warning" />
                                            {'  '}
                                        </span>
                                    )
                                }
                                <strong><FormattedMessage id="main.label.informations" defaultMessage="Informations" /></strong>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                ID
                            </th>
                            <td>
                                {currentCase.id}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.screening_type" defaultMessage="Type de dépistage" />
                            </th>
                            <td>
                                {!currentCase.screening_type && '--'}
                                {currentCase.screening_type === 'active'
                                    && <FormattedMessage id="main.label.active" defaultMessage="Active" />
                                }
                                {currentCase.screening_type === 'passive'
                                    && <FormattedMessage id="main.label.passive" defaultMessage="Passive" />
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.stage" defaultMessage="Stade" />
                            </th>
                            <td>
                                {
                                    currentCase.test_pl_result === 'stage1' ? '1' : ''
                                }
                                {
                                    currentCase.test_pl_result === 'stage2' ? '2' : ''
                                }
                                {
                                    !currentCase.test_pl_result ? '--' : ''
                                }
                                {
                                    currentCase.test_pl_result === 'unknown'
                                        ? <FormattedMessage id="main.label.unknown" defaultMessage="Inconnu" /> : ''
                                }
                            </td>
                        </tr>
                        {currentCase.circumstances_da_um !== undefined
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCases.circumstances_da_um" defaultMessage="UM active screening" />
                                    </th>
                                    <td>
                                        {currentCase.circumstances_da_um}
                                    </td>
                                </tr>
                            )
                        }
                        {currentCase.circumstances_dp_um !== undefined
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCases.circumstances_dp_um" defaultMessage="UM passive screening" />
                                    </th>
                                    <td>
                                        {currentCase.circumstances_dp_um}
                                    </td>
                                </tr>
                            )
                        }
                        {currentCase.circumstances_dp_cdtc !== undefined
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCases.circumstances_dp_cdtc" defaultMessage="Passive screening CDTC" />
                                    </th>
                                    <td>
                                        {currentCase.circumstances_dp_cdtc}
                                    </td>
                                </tr>
                            )
                        }
                        {currentCase.circumstances_dp_cs !== undefined
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCases.circumstances_dp_cs" defaultMessage="CS passive screening" />
                                    </th>
                                    <td>
                                        {currentCase.circumstances_dp_cs}
                                    </td>
                                </tr>
                            )
                        }
                        {currentCase.circumstances_dp_hgr !== undefined
                            && (
                                <tr>
                                    <th>
                                        <FormattedMessage id="patientsCases.circumstances_dp_hgr" defaultMessage="HGR passive screening" />
                                    </th>
                                    <td>
                                        {currentCase.circumstances_dp_hgr}
                                    </td>
                                </tr>
                            )
                        }
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.team" defaultMessage="Equipe" />
                            </th>
                            <td className={`${similarCase && (teamName !== duplicateTeamName) ? 'error' : ''} ${!currentCase.team.normalized_team ? 'error-text' : ''}`}>
                                {
                                    !currentCase.team.normalized_team
                                    && <FormattedMessage id="main.label.teamNotFound" defaultMessage="Team not found" />
                                }
                                {
                                    currentCase.team.normalized_team
                                    && teamName
                                }
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.form_number" defaultMessage="Form number" />
                            </th>
                            <td className={`${similarCase && (similarCase.form_number !== currentCase.form_number) ? 'error' : ''}`}>
                                {currentCase.form_number ? currentCase.form_number : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.form_year" defaultMessage="Form year" />
                            </th>
                            <td className={`${similarCase && (similarCase.form_year !== currentCase.form_year) ? 'error' : ''}`}>
                                {currentCase.form_year ? currentCase.form_year : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="main.label.source" defaultMessage="Source" />
                            </th>
                            <td className={`${similarCase && (similarCase.source !== currentCase.source) ? 'error' : ''}`}>
                                {currentCase.source && MESSAGES[currentCase.source]
                                    ? formatMessage(MESSAGES[currentCase.source])
                                    : currentCase.source}
                                {!currentCase.source && '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.device.last_user" defaultMessage="Device's user" />
                            </th>
                            <td className={`${similarCase && currentCase.device && similarCase.device && (similarCase.device.last_user !== currentCase.device.last_user) ? 'error' : ''}`}>
                                {currentCase.device && currentCase.device.last_user ? currentCase.device.last_user : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.device.last_team" defaultMessage="Device's team" />
                            </th>
                            <td className={`${similarCase && currentCase.device && similarCase.device && (similarCase.device.last_team !== currentCase.device.last_team) ? 'error' : ''}`}>
                                {currentCase.device && currentCase.device.last_team ? currentCase.device.last_team : '--'}
                            </td>
                        </tr>
                        <tr>
                            <th>
                                <FormattedMessage id="patientsCases.device.id" defaultMessage="Tablet id" />
                            </th>
                            <td className={`${similarCase && currentCase.device && similarCase.device && (similarCase.device.device_id !== currentCase.device.device_id) ? 'error' : ''}`}>
                                {currentCase.device && currentCase.device.device_id ? currentCase.device.device_id : '--'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}


PatientCasesInfo.defaultProps = {
    similarCase: undefined,
    currentCase: undefined,
};

PatientCasesInfo.propTypes = {
    currentCase: PropTypes.object,
    similarCase: PropTypes.object,
    intl: PropTypes.object.isRequired,
};

const PatientCasesWithIntl = injectIntl(PatientCasesInfo);

export default PatientCasesWithIntl;
