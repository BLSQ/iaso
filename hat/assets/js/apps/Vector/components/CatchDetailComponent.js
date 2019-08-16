import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';
import moment from 'moment';

class CatchDetailComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            catchItem: props.catch,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            catchItem: nextProps.catch,
        });
    }

    render() {
        const { catchItem } = this.state;
        const {
            getDetail,
            toggleModal,
            problems,
            intl: {
                formatMessage,
            },
        } = this.props;
        let problemLabel = '--';
        if (catchItem.problem && !!problems.length) {
            const problemItem = problems.find(p => p[0] === catchItem.problem);
            problemLabel = problemItem ? formatMessage({
                defaultMessage: problemItem[1],
                id: `vectors.label.${problemItem[0]}`,
            }) : '--';
        }
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => toggleModal()}
                overlayClassName="transparent-overlay"
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.catch.title" defaultMessage="Catch" />
                </div>
                <section className="edit-modal large extra">
                    <section className="half-container">
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <th>UUID</th>
                                        <td className="small">
                                            {catchItem.uuid}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.site"
                                                defaultMessage="Site"
                                            />
                                        </th>
                                        <td >
                                            {
                                                catchItem.trap &&
                                                <Fragment>
                                                    {catchItem.trap.name}
                                                    <button
                                                        className="button--tiny margin-left"
                                                        id="edit-button"
                                                        onClick={() => {
                                                            toggleModal();
                                                            setTimeout(() => {
                                                                getDetail(catchItem.trap.id, 'traps', 'showEditTrapsModale');
                                                            }, 100);
                                                        }}
                                                    >
                                                        <i className="fa fa-pencil-square-o" />
                                                    </button>
                                                </Fragment>
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.created_at"
                                                defaultMessage="Created at"
                                            />
                                        </th>
                                        <td>
                                            {moment(catchItem.setup_date).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.collecte"
                                                defaultMessage="Last collection"
                                            />
                                        </th>
                                        <td>
                                            {moment(catchItem.collect_date).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.latitude"
                                                defaultMessage="Latitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.latitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.longitude"
                                                defaultMessage="Longitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.longitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.altitude"
                                                defaultMessage="Altitude"
                                            />
                                        </th>
                                        <td>
                                            {catchItem.altitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.accuracy"
                                                defaultMessage="Précision"
                                            />
                                        </th>
                                        <td>{catchItem.accuracy ? catchItem.accuracy : '--'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.catchs.male_count"
                                                defaultMessage="Males"
                                            />
                                        </th>
                                        <td>{catchItem.male_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.catchs.female_count"
                                                defaultMessage="Females"
                                            />
                                        </th>
                                        <td>{catchItem.female_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.unknowns"
                                                defaultMessage="Unknown"
                                            />
                                        </th>
                                        <td>{catchItem.unknown_count}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.remarks"
                                                defaultMessage="Remark"
                                            />
                                        </th>
                                        <td>{catchItem.remarks}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.problem"
                                                defaultMessage="Problem"
                                            />
                                        </th>
                                        <td>{problemLabel}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.user"
                                                defaultMessage="User"
                                            />
                                        </th>
                                        <td>{catchItem.username}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="main.label.source"
                                                defaultMessage="Source"
                                            />
                                        </th>
                                        <td>{catchItem.source}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Close" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}

CatchDetailComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    catch: PropTypes.object.isRequired,
    getDetail: PropTypes.func.isRequired,
    problems: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const MapStateToProps = state => ({
    problems: state.vectors.problems,
});


export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(CatchDetailComponent));
