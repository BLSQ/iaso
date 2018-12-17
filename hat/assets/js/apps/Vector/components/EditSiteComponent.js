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
class EditSiteComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            site: props.site,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            site: nextProps.site,
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
        console.log(this.state.site);
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal">
                    {
                        this.state.site &&
                        <div>
                            {this.state.site.id}
                            {this.state.site.name}
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
EditSiteComponent.defaultProps = {
    site: undefined,
};
EditSiteComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    site: PropTypes.object,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(EditSiteComponent);
