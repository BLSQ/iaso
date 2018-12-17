import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
    },
});
class EditTargetComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            target: props.target,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            target: nextProps.target,
            isChanged: false,
        });
    }

    updateCoordinationField(key, value) {
        const newTeam = Object.assign({}, this.state.coordination, { [key]: value });
        this.setState({
            coordination: newTeam,
            isChanged: true,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal">
                    {
                        this.state.target &&
                        <div>
                            {this.state.target.id}
                            {this.state.target.name}
                        </div>
                    }
                    <div>
                        {this.state.isChanged}
                    </div>
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                        </button>
                        {/* <button
                        disabled={
                            (this.state.coordination.name === '' ||
                                (!this.state.isChanged && this.state.coordination.id !== 0))
                        }
                        className="button--save"
                        onClick={() => this.props.saveCoordination(this.state.coordination)}
                    >
                        <i className="fa fa-save" />
                        <FormattedMessage id="mangement.label.saveCoordination" defaultMessage="Sauvegarder la coordination" />
                    </button> */}
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditTargetComponent.defaultProps = {
    target: {
        id: 0,
        name: '',
    },
};
EditTargetComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    target: PropTypes.object,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(EditTargetComponent);
