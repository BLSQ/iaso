import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

class SuperUserImageItem extends React.Component {
    render() {
        const {
            currentTest,
            title,
        } = this.props;
        return (
            <section className="test-infos video">
                <h4>
                    {title}
                    <span className="date">
                        <FormattedMessage id="quality.date" defaultMessage="Date" />:
                        {` ${moment(currentTest.updated_at).format('DD-MM-YYYY')}`}
                    </span>
                </h4>
                <div>
                    <div className="quality-label inline">
                        <FormattedMessage id="quality.user" defaultMessage="Utilisateur" />:
                    </div>
                    <span>
                        {currentTest.validator.firstName} {' '}
                        {currentTest.validator.lastName} {' '}
                        {currentTest.validator.userName}
                    </span>
                </div>
                <div>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.main.isClear"
                            defaultMessage="Clearness"
                        />:
                    </div>
                    <span>
                        {currentTest.is_clear ?
                            <FormattedMessage id="main.label.yes" defaultMessage="Yes" /> :
                            <FormattedMessage id="main.label.no" defaultMessage="No" />}
                    </span>
                </div>
                {
                    currentTest.is_clear &&
                    <Fragment>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.main.search"
                                    defaultMessage="Parasitic search in the right place"
                                />:
                            </div>
                            <span>
                                {currentTest.is_good_place ?
                                    <FormattedMessage id="main.label.yes" defaultMessage="Yes" /> :
                                    <FormattedMessage id="main.label.no" defaultMessage="No" />}
                            </span>
                        </div>
                        <div>
                            <div className="quality-label inline">
                                <FormattedMessage
                                    id="quality.main.confirm"
                                    defaultMessage="Trypanosome view confirmation"
                                />:
                            </div>
                            <span>
                                {currentTest.is_confirmed_case ?
                                    <FormattedMessage id="main.label.yes" defaultMessage="Yes" /> :
                                    <FormattedMessage id="main.label.no" defaultMessage="No" />}
                            </span>
                        </div>
                    </Fragment>
                }
                <div>
                    <div className="quality-label inline">
                        <FormattedMessage
                            id="quality.main.otherParasites"
                            defaultMessage="Other parasite"
                        />:
                    </div>
                    <span>
                        {currentTest.has_other_parasite ?
                            <FormattedMessage id="main.label.yes" defaultMessage="Yes" /> :
                            <FormattedMessage id="main.label.no" defaultMessage="No" />}
                    </span>
                </div>
                {
                    currentTest.comment &&
                    <div className="comment-container">
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.comment"
                                defaultMessage="Comment"
                            />:
                        </div>
                        <span>
                            {currentTest.comment}
                        </span>
                    </div>
                }
            </section>);
    }
}

SuperUserImageItem.propTypes = {
    currentTest: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
};

const SuperUserImageItemIntl = injectIntl(SuperUserImageItem);

export default SuperUserImageItemIntl;
