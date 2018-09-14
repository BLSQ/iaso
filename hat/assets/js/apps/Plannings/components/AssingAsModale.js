
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


class AssingAsModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('body');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
        });
    }

    render() {
        const {
            area,
            zoneName,
            workZone,
            assignArea,
            assignZone,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModale()}
            >
                <section className="half">
                    <div>
                        <FormattedMessage id="microplanning.macro.selectedAs" defaultMessage="Aire de santé" />:
                        {' '}
                        <b>{area.name}</b>
                        <div className="align-center">
                            {
                                workZone.id && workZone.id !== area.workzoneId &&
                                <button
                                    className="button"
                                    onClick={() => assignArea(true)}
                                >
                                    <span>
                                        <FormattedMessage
                                            id="macroplanning.label.assignAs"
                                            defaultMessage="Assigner l'AS à"
                                        />
                                        {' '}   {workZone.name}
                                    </span>
                                </button>
                            }
                            {
                                area.workzone &&
                                <button
                                    className="button--danger"
                                    onClick={() => assignArea(false)}
                                >
                                    <span>
                                        <FormattedMessage
                                            id="macroplanning.label.unAssignAs"
                                            defaultMessage="Enlever l'AS de"
                                        />
                                        {' '}  {area.workzone}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                    <div>
                        <FormattedMessage id="macroplanning.label.selectedZs" defaultMessage="Zone de santé" />:
                        {' '}
                        <b>{zoneName}</b>
                        <div className="align-center">
                            {
                                workZone.id && workZone.id !== area.workzoneId &&
                                <button
                                    className="button"
                                    onClick={() => assignZone(true)}
                                >
                                    <span>
                                        <FormattedMessage
                                            id="macroplanning.label.assignZs"
                                            defaultMessage="Assigner la ZS à"
                                        />
                                        {' '}   {workZone.name}
                                    </span>
                                </button>
                            }
                            {
                                area.workzone &&
                                <button
                                    className="button--danger"
                                    onClick={() => assignZone(false)}
                                >
                                    <span>
                                        <FormattedMessage
                                            id="macroplanning.label.unAssignZs"
                                            defaultMessage="Enlever la ZS de"
                                        />
                                        {' '}  {area.workzone}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                </section>
                <div>
                    <button
                        className="button"
                        onClick={() => this.props.closeModale()}
                    >
                        <i className="fa fa-arrow-left" />
                        <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                    </button>
                </div>
            </ReactModal>
        );
    }
}


AssingAsModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    closeModale: PropTypes.func.isRequired,
    area: PropTypes.object.isRequired,
    zoneName: PropTypes.string.isRequired,
    workZone: PropTypes.object.isRequired,
    assignArea: PropTypes.func.isRequired,
    assignZone: PropTypes.func.isRequired,
};

export default injectIntl(AssingAsModale);
