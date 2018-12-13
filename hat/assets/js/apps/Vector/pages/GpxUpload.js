import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import UploadFile from '../../../components/UploadFile';


class GpxUpload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <section>
                <div className="widget__container">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    }
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="uploadFile.Title" defaultMessage="Import de fichiers GPX" />
                        </h2>
                    </div>
                    <div className="widget__content">
                        <UploadFile endPointUrl="/vector/gpx_upload/" accept=".gpx" inputName="gpx" />
                    </div>
                </div>
            </section>);
    }
}

GpxUpload.defaultProps = {
};

GpxUpload.propTypes = {
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const GpxUploadIntl = injectIntl(GpxUpload);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(GpxUploadIntl);
