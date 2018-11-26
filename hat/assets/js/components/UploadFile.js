import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const request = require('superagent');

const MESSAGES = defineMessages({
    'no-file': {
        defaultMessage: 'Aucun fichier sélectionné',
        id: 'uploadFile.labels.no-file',
    },
});

const initialState = {
    selectedFile: undefined,
    loaded: 0,
    isUploadInProgress: false,
    hasErrors: false,
    isUploaded: false,
};

class UploadfFle extends React.Component {
    constructor(props) {
        super(props);
        this.state = initialState;
    }

    handleselectedFile(event) {
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
        });
    }

    handleUpload() {
        if (this.state.selectedFile) {
            this.setState({
                isUploadInProgress: true,
            });
            const formData = new FormData();
            formData.append('gpx', this.state.selectedFile, this.state.selectedFile.name);

            request.post(this.props.endPointUrl)
                .attach('gpx', formData.get('gpx'))
                .on('progress', e =>
                    (this.setState({
                        loaded: e.percent,
                    })))
                .end((error) => {
                    if (error) {
                        this.setState({
                            hasErrors: true,
                            isUploaded: false,
                            isUploadInProgress: false,
                        });
                    } else {
                        this.setState({
                            hasErrors: false,
                            isUploaded: true,
                            isUploadInProgress: false,
                        });
                    }
                });
        }
    }


    render() {
        const {
            intl: {
                formatMessage,
            },
            accept,
        } = this.props;
        const {
            isUploadInProgress,
            selectedFile,
            hasErrors,
            isUploaded,
        } = this.state;

        return (
            <div className="upload-container">
                <div className="upload-foreground">
                    <input
                        onClick={(e) => {
                            e.target.value = null;
                            this.setState(initialState);
                        }
                        }
                        type="file"
                        accept={accept}
                        name="fileUpload"
                        onChange={e => this.handleselectedFile(e)}
                    />
                </div>
                <div className="upload-background">
                    <input readOnly type="text" value={selectedFile ? selectedFile.name : formatMessage(MESSAGES['no-file'])} />
                    <button
                        className="button--add"
                        disabled={isUploadInProgress}
                    >
                        <FormattedMessage id="uploadFile.label.browse" defaultMessage="Ouvrir" />
                    </button>
                </div>
                {
                    selectedFile &&
                    <button
                        className="button--add"
                        disabled={isUploadInProgress}
                        onClick={() => this.handleUpload()}
                    >
                        <i className="fa fa-upload" />
                        <FormattedMessage id="uploadFile.label.send" defaultMessage="Envoyer" />
                    </button>
                }
                {
                    isUploadInProgress &&
                    <div className="upload-status">
                        <div
                            className="upload-status-bar"
                            style={{ width: `${Math.round(this.state.loaded, 2)}%` }}
                        />
                        <div
                            className="upload-status-infos"
                        >
                            {Math.round(this.state.loaded, 2)} %
                        </div>
                    </div>
                }
                {
                    hasErrors &&
                    <div className="error">
                        <FormattedMessage id="uploadFile.label.error" defaultMessage="Une erreur est survenue pendant l'envoi du fichier" />
                    </div>
                }
                {
                    isUploaded &&
                    <div className="success">
                        <FormattedMessage id="uploadFile.label.success" defaultMessage="Fichier correctement envoyé" />
                    </div>
                }

            </div>);
    }
}

UploadfFle.propTypes = {
    intl: PropTypes.object.isRequired,
    endPointUrl: PropTypes.string.isRequired,
    accept: PropTypes.string.isRequired,
};

const UploadfFleIntl = injectIntl(UploadfFle);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(UploadfFleIntl);

