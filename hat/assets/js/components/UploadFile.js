import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const request = require('superagent');

const MESSAGES = defineMessages({
    'no-file': {
        defaultMessage: 'No file choosen',
        id: 'uploadFile.labels.no-file',
    },
    'click-to-send': {
        defaultMessage: 'Click to send',
        id: 'uploadFile.labels.click-to-send',
    },
});

class UploadfFle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFiles: [],
            loaded: 0,
            isUploadInProgress: false,
            hasErrors: false,
            isUploaded: false,
            resultsList: [],
        };
    }
    resetUpload(full = false) {
        const newState = {
            loaded: 0,
            isUploadInProgress: false,
            hasErrors: false,
            isUploaded: false,
            resultsList: [],
        };
        if (full) {
            newState.selectedFiles = [];
        }
        this.setState(newState);
    }

    handleselectedFile(event) {
        if (this.state.isUploaded) {
            this.resetUpload();
        }
        const { selectedFiles } = this.state;
        Object.keys(event.target.files).map((key, index) => {
            const file = event.target.files[key];
            file.index = index;
            selectedFiles.push(file);
            return null;
        });
        this.setState({
            selectedFiles,
            loaded: 0,
            resultsList: [],
        });
    }

    handleUpload() {
        if (this.state.selectedFiles.length > 0) {
            this.setState({
                isUploadInProgress: true,
            });
            const formData = new FormData();

            this.state.selectedFiles.map((file) => {
                formData.append(this.props.inputName, file, file.name);
                return null;
            });
            request.post(this.props.endPointUrl)
                .send(formData)
                .on('progress', (e) => {
                    if (e.direction === 'upload') {
                        this.setState({
                            loaded: e.percent,
                        });
                    }
                })
                .end((error, res) => {
                    if (error) {
                        this.setState({
                            hasErrors: true,
                            isUploaded: false,
                            isUploadInProgress: false,
                            resultsList: [],
                        });
                    } else {
                        this.setState({
                            hasErrors: false,
                            isUploaded: true,
                            selectedFiles: [],
                            isUploadInProgress: false,
                            resultsList: res.body.imports,
                        });
                    }
                });
        }
    }

    deleteFile(fileIndex) {
        const { selectedFiles } = this.state;
        selectedFiles.splice(fileIndex, 1);
        this.setState({
            selectedFiles,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            accept,
            inputName,
        } = this.props;
        const {
            isUploadInProgress,
            selectedFiles,
            hasErrors,
            isUploaded,
            resultsList,
        } = this.state;
        return (
            <div className="upload-container">
                <div className="upload-foreground">
                    <input
                        onClick={(e) => {
                            e.target.value = null;
                            if (isUploaded) {
                                this.resetUpload();
                            }
                        }
                        }
                        type="file"
                        accept={accept}
                        name={inputName}
                        multiple
                        onChange={e => this.handleselectedFile(e)}
                    />
                </div>
                <div className="upload-background">
                    <input readOnly type="text" value={selectedFiles.length > 0 ? formatMessage(MESSAGES['click-to-send']) : formatMessage(MESSAGES['no-file'])} />
                    <button
                        className="button--add"
                        disabled={isUploadInProgress}
                    >
                        <FormattedMessage id="uploadFile.label.browse" defaultMessage="Browse" />
                    </button>
                </div>
                {
                    selectedFiles.length > 0 &&
                    <span>
                        <button
                            className="button--add"
                            disabled={isUploadInProgress}
                            onClick={() => this.handleUpload()}
                        >
                            <i className="fa fa-upload" />
                            <FormattedMessage id="uploadFile.label.send" defaultMessage="Send" />
                        </button>
                        <button
                            className="button--danger"
                            disabled={isUploadInProgress}
                            onClick={() => this.resetUpload(true)}
                        >
                            <i className="fa fa-times" />
                            <FormattedMessage id="uploadFile.label.reset" defaultMessage="Erase all" />
                        </button>
                    </span>
                }
                {
                    !isUploadInProgress && !isUploaded && selectedFiles.length > 0 &&
                    <div className="upload-files">
                        {

                            this.state.selectedFiles.map((file, index) => (
                                <div key={`${file.name}-${file.index}`}>
                                    <button
                                        className="button delete-file"
                                        onClick={() => this.deleteFile(index)}
                                    >
                                        <i className="fa fa-times" />
                                    </button>
                                    {file.name}
                                </div>
                            ))
                        }
                    </div>
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
                        <FormattedMessage id="uploadFile.label.error" defaultMessage="An error occured while uploading files" />
                    </div>
                }
                {
                    isUploaded &&
                    <section>
                        <div className="success">
                            <FormattedMessage id="uploadFile.label.success" defaultMessage="File(s) correctly send" />:
                        </div>
                        <ul className="file-list">
                            {
                                resultsList.map(r => (
                                    <li key={r.gpx_import_id}>
                                        {r.fileName}: {r.count}{' '}<FormattedMessage id="uploadFile.label.points-imported" defaultMessage="point(s) imported" />
                                    </li>))
                            }
                        </ul>

                    </section>
                }

            </div>);
    }
}

UploadfFle.propTypes = {
    intl: PropTypes.object.isRequired,
    endPointUrl: PropTypes.string.isRequired,
    accept: PropTypes.string.isRequired,
    inputName: PropTypes.string.isRequired,
};

const UploadfFleIntl = injectIntl(UploadfFle);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = () => ({});

export default connect(MapStateToProps, MapDispatchToProps)(UploadfFleIntl);

