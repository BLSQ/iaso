import React, { FunctionComponent } from 'react';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import { useSafeIntl } from 'bluesquare-components';
import Descriptor from '../descriptor';
import ObjectDumper from './ObjectDumper';
import MESSAGES from '../messages';

type Props = {
    question?: Record<string, any> | null;
};

const QuestionInfos: FunctionComponent<Props> = ({ question = null }) => {
    const { formatMessage } = useSafeIntl();
    const label = Descriptor.getHumanLabel(question);
    return (
        <div>
            <Typography variant="h3" component="h3">
                {`${_.truncate(label)} - ${question?.name}`}
            </Typography>
            <br />
            <br />
            <ObjectDumper object={question} />
            {question?.bind && question?.bind.calculate && (
                <span>Calculate :{question?.bind.calculate}</span>
            )}
            {question?.children && (
                <>
                    {formatMessage(MESSAGES.options)}
                    {}
                    {question?.children.map(c => c.name).join(' , ')}
                </>
            )}
        </div>
    );
};

export default QuestionInfos;
