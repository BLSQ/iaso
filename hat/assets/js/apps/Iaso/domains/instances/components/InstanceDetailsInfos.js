import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import InstanceDetailsField from './InstanceDetailsField';

import { INSTANCE_METAS_FIELDS } from '../constants';
import MESSAGES from '../messages';


const InstanceDetailsInfos = ({
    currentInstance,
    intl: {
        formatMessage,
    },
}) => {
    const fields = INSTANCE_METAS_FIELDS.filter(f => f.type === 'info');
    return (
        <>
            {
                fields.map(f => (
                    <InstanceDetailsField
                        key={f.key}
                        label={formatMessage(MESSAGES[f.key])}
                        valueTitle={f.title ? f.title(currentInstance[f.key]) : null}
                        value={f.render ? f.render(currentInstance[f.key]) : currentInstance[f.key]}
                    />
                ))
            }
        </>
    );
};


InstanceDetailsInfos.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};
export default injectIntl(InstanceDetailsInfos);
