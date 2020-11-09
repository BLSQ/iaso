import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import _ from 'lodash';
import Descriptor from '../descriptor';
import ObjectDumper from './ObjectDumper';

const QuestionInfos = ({ question }) => {
    const label = Descriptor.getHumanLabel(question);
    return (
        <div>
            <Typography variant="h3" component="h3">
                {`${_.truncate(label)} - ${question.name}`}
            </Typography>
            <br />
            <br />
            <ObjectDumper object={question} />
            {question.bind && question.bind.calculate && (
                <span>Calculate :{question.bind.calculate}</span>
            )}
            {question.children && (
                <>
                    {' Options :'}
                    {question.children.map(c => c.name).join(' , ')}
                </>
            )}
        </div>
    );
};

QuestionInfos.defaultProps = {
    question: null,
};

QuestionInfos.propTypes = {
    question: PropTypes.object,
};

export default QuestionInfos;
