import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';
import { CattTypeConstant, RdtTypeConstant } from '../../../../utils/constants/ImageTypeConstant';

const getResult = (value, list) => list.find(e => e.value === value);

class SuperUserImageItem extends React.Component {
    render() {
        const {
            currentTest,
            title,
            intl: {
                formatMessage,
            },
        } = this.props;
        const typeConstant = currentTest.type === 'RDT' ?
            RdtTypeConstant : CattTypeConstant;
        return (
            <section className="test-infos">
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
                            id="quality.results"
                            defaultMessage="Résultat"
                        />:
                    </div>
                    <span>
                        {formatMessage(getResult(currentTest.result, typeConstant))}
                    </span>
                </div>
                {
                    currentTest.comment &&
                    <div className="comment-container">
                        <div className="quality-label inline">
                            <FormattedMessage
                                id="quality.comment"
                                defaultMessage="Commentaire"
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
    intl: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
};

const SuperUserImageItemIntl = injectIntl(SuperUserImageItem);

export default SuperUserImageItemIntl;
