import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import ImageValidatorComponent from '../components/ImageValidatorComponent';
import { createUrl } from '../../../utils/fetchData';
import { saveTest } from '../../../utils/saveData';
import { testActions } from '../redux/test';


class QualityImages extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
        this.props.fetchTestDetail(this.props.params.test_id);
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.test_id !== this.props.params.test_id)) {
            this.fetchTestDetail(nextProps.params.test_id);
        }
    }

    saveTestItem(imageItems) {
        const promisesArray = [];
        imageItems.map((item) => {
            promisesArray.push(saveTest({ result: item.result, test_id: item.id }, this.props.dispatch));
            return null;
        });
        Promise.all(promisesArray).then(() => {
            this.updateImageList(this.state.currentType);
        }).catch(error => console.error(`Error while saving test: ${error}`));
    }

    goBack() {
        const newParams = {
            ...this.props.params,
        };
        delete newParams.test_id;
        this.props.redirectTo('dashboard', newParams);
    }

    render() {
        const { loading, error } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <div className="widget__container quality-control">
                {
                    loading &&
                    <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }
                <section>
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <button
                                className="button--small"
                                onClick={() => this.goBack()}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                        </h2>
                    </div>
                    {
                        this.props.currentTest.id &&
                        <ImageValidatorComponent
                            currentTest={this.props.currentTest}
                            saveTest={imageItems => this.saveTestItem(imageItems)}
                            error={error}
                        />
                    }
                </section>
            </div>);
    }
}

QualityImages.defaultProps = {
};

QualityImages.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchTestDetail: PropTypes.func.isRequired,
    currentTest: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const QualityImagesIntl = injectIntl(QualityImages);

const MapStateToProps = state => ({
    load: state.load,
    currentTest: state.test.currentTest,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTestDetail: id => dispatch(testActions.fetchTestDetail(dispatch, id)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityImagesIntl);
