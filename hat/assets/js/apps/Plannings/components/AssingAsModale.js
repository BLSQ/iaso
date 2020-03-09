
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
                        <FormattedMessage id="main.label.area" defaultMessage="Health area" />
:
                        {' '}
                        <b>{area.name}</b>
                        <div className="align-center">
                            {
                                workZone.id && workZone.id !== area.workzoneId
                                && (
                                    <button
                                        className="button"
                                        onClick={() => assignArea(true)}
                                    >
                                        <span>
                                            <FormattedMessage
                                                id="macroplanning.label.assignAs"
                                                defaultMessage="Assign health area to"
                                            />
                                            {' '}
                                            {' '}
                                            {workZone.name}
                                        </span>
                                    </button>
                                )
                            }
                            {
                                area.workzone
                                && (
                                    <button
                                        className="button--danger"
                                        onClick={() => assignArea(false)}
                                    >
                                        <span>
                                            <FormattedMessage
                                                id="macroplanning.label.unAssignAs"
                                                defaultMessage="Remove the area from"
                                            />
                                            {' '}
                                            {' '}
                                            {area.workzone}
                                        </span>
                                    </button>
                                )
                            }
                        </div>
                    </div>
                    <div>
                        <FormattedMessage id="main.label.zone" defaultMessage="Health area" />
:
                        {' '}
                        <b>{zoneName}</b>
                        <div className="align-center">
                            {
                                workZone.id && workZone.id !== area.workzoneId
                                && (
                                    <button
                                        className="button"
                                        onClick={() => assignZone(true)}
                                    >
                                        <span>
                                            <FormattedMessage
                                                id="macroplanning.label.assignZs"
                                                defaultMessage="Assigned zone to"
                                            />
                                            {' '}
                                            {' '}
                                            {workZone.name}
                                        </span>
                                    </button>
                                )
                            }
                            {
                                area.workzone
                                && (
                                    <button
                                        className="button--danger"
                                        onClick={() => assignZone(false)}
                                    >
                                        <span>
                                            <FormattedMessage
                                                id="macroplanning.label.unAssignZs"
                                                defaultMessage="Remove zone from"
                                            />
                                            {' '}
                                            {' '}
                                            {area.workzone}
                                        </span>
                                    </button>
                                )
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
                        <FormattedMessage id="main.label.cancel" defaultMessage="Cancel" />
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
