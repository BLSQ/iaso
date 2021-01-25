import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import InstanceDetailsField from './InstanceDetailsField';

import { INSTANCE_METAS_FIELDS } from '../constants';
import MESSAGES from '../messages';
import injectIntl from '../../../libs/intl/injectIntl';

const InstanceDetailsInfos = ({
    currentInstance,
    intl: { formatMessage },
    fieldsToHide,
}) => {
    const fields = INSTANCE_METAS_FIELDS.filter(
        f => f.type === 'info' && !fieldsToHide.includes(f.key),
    );
    return (
        <>
            {fields.map(f => {
                const value = get(currentInstance, f.key);

                return (
                    <InstanceDetailsField
                        key={f.key}
                        label={formatMessage(
                            MESSAGES['labelKey' in f ? f.labelKey : f.key],
                        )}
                        valueTitle={
                            f.title ? f.title(currentInstance[f.key]) : null
                        }
                        value={f.render ? f.render(value) : value}
                    />
                );
            })}
        </>
    );
};

InstanceDetailsInfos.defaultProps = {
    fieldsToHide: [],
};

InstanceDetailsInfos.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fieldsToHide: PropTypes.array,
};
export default injectIntl(InstanceDetailsInfos);
