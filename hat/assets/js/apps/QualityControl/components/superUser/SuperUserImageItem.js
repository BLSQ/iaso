import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import { getResult } from './SuperUserImageComponent';


class SuperUserImageItem extends React.Component {
    render() {
        const {
            currentTest,
            title,
            typeConstant,
        } = this.props;
        return (
            <section className="test-infos">
                <h4>
                    {title}
                    <span className="date">
                        <FormattedMessage id="main.label.date" defaultMessage="Date" />:
                        {` ${moment(currentTest.updated_at).format('DD-MM-YYYY')}`}
                    </span>
                </h4>
                <div>
                    <div className="quality-label inline">
                        <FormattedMessage id="main.label.user" defaultMessage="User" />:
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
                            id="qmain.label.result"
                            defaultMessage="Result"
                        />:
                    </div>
                    <span>
                        {currentTest.result ? getResult(currentTest.result, typeConstant) : <FormattedMessage id="quality.noresult" defaultMessage="Pas de résultat" /> }
                    </span>
                </div>
                {
                    currentTest.comment &&
                    <div className="comment-container">
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="main.label.comment"
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
    typeConstant: PropTypes.array.isRequired,
};

const SuperUserImageItemIntl = injectIntl(SuperUserImageItem);

export default SuperUserImageItemIntl;
