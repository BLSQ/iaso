import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';
import ImageValidatorComponent from '../components/ImageValidatorComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { getRequest, createUrl } from '../../../utils/fetchData';
import { saveTest } from '../../../utils/saveData';
import { imageActions } from '../redux/image';

const imageTypesList = [
    {
        label: 'CATT',
        value: 'CATT',
    },
    {
        label: 'RDT',
        value: 'RDT',
    },
];

class QualityImages extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentType: imageTypesList[0].value,
        };
    }

    componentDidMount() {
        this.updateImageList(this.state.currentType);
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.date_from !== this.props.params.date_from) ||
            (nextProps.params.date_to !== this.props.params.date_to)) {
            this.updateImageList(
                this.state.currentType,
                nextProps.params.date_from,
                nextProps.params.date_to,
            );
        }
    }

    onChangetype(newtype) {
        this.setState({
            currentType: newtype,
        });
        this.updateImageList(newtype);
    }

    updateImageList(type, from = this.props.params.date_from, to = this.props.params.date_to) {
        const url = `/api/qctests/?type=${type}&limit=1&checked=false&from=${from}&to=${to}`;
        getRequest(url, this.props.dispatch).then((response) => {
            this.props.dispatch(imageActions.setImageList(response));
        });
    }

    saveTestItem(test) {
        saveTest(test, this.props.dispatch).then((isSaved) => {
            if (isSaved) {
                this.updateImageList(this.state.currentType);
            }
        });
    }

    render() {
        if (!this.props.imageList) {
            return null;
        }
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
                                onClick={() =>
                                    this.props.redirectTo('', {
                                        date_from: this.props.params.date_from,
                                        date_to: this.props.params.date_to,
                                    })}
                            >
                                <i className="fa fa-arrow-left" />
                            </button>
                            {
                                !this.props.imageList.results[0] &&
                                <section>
                                    <FormattedMessage
                                        id="quality.image.noimage"
                                        defaultMessage="Aucune image trouvée"
                                    />
                                </section>
                            }

                            {
                                this.props.imageList.results[0] &&
                                <section>
                                    <FormattedMessage
                                        id="quality.label.rest"
                                        defaultMessage="Reste"
                                    />
                                    <span>
                                        {` ${this.props.imageList.remaining_count} `}
                                    </span>
                                    <FormattedMessage
                                        id="quality.label.imagetockeck"
                                        defaultMessage="image(s) à vérifier"
                                    />
                                </section>
                            }
                            <PeriodSelectorComponent
                                dateFrom={this.props.params.date_from}
                                dateTo={this.props.params.date_to}
                                onChangeDate={(dateFrom, dateTo) =>
                                    this.props.redirectTo('images', {
                                        date_from: dateFrom,
                                        date_to: dateTo,
                                    })}
                            />
                        </h2>
                        <div className="type-filter">
                            <div className="filter__label">
                                <FormattedMessage
                                    id="quality.image.typelabel"
                                    defaultMessage="Type d'image"
                                />:
                            </div>
                            <Select
                                clearable={false}
                                simpleValue
                                name="currentType"
                                value={this.state.currentType}
                                placeholder="--"
                                options={imageTypesList}
                                onChange={event => this.onChangetype(event)}
                            />
                        </div>
                    </div>

                    {
                        this.props.imageList.results[0] &&
                        <ImageValidatorComponent
                            imageItem={this.props.imageList.results[0]}
                            type={this.state.currentType}
                            saveTest={test => this.saveTestItem(test)}
                            error={error}
                        />
                    }
                </section>
            </div>);
    }
}

QualityImages.defaultProps = {
    imageList: null,
};

QualityImages.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    imageList: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
};

const QualityImagesIntl = injectIntl(QualityImages);

const MapStateToProps = state => ({
    load: state.load,
    imageList: state.imageList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(QualityImagesIntl);
