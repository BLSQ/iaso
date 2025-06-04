import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { useSafeIntl } from 'bluesquare-components';
import InstanceDetailsField from './InstanceDetailsField';

import MESSAGES from '../messages';

const InstanceDetailsInfos = ({
    currentInstance,
    fieldsToHide,
    instance_metas_fields,
}) => {
    const { formatMessage } = useSafeIntl();
    const fields = instance_metas_fields.filter(
        f =>
            f.type === 'info' &&
            !fieldsToHide.includes(f.translationKey ?? f.key),
    );
    return (
        <>
            {fields.map(f => {
                const value = get(currentInstance, f.key);

                return (
                    <InstanceDetailsField
                        key={f.key}
                        renderValue={
                            f.renderValue
                                ? () => f.renderValue(currentInstance)
                                : null
                        }
                        label={formatMessage(
                            MESSAGES[
                                'labelKey' in f
                                    ? f.labelKey
                                    : f.translationKey ?? f.key
                            ],
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
    fieldsToHide: PropTypes.array,
    instance_metas_fields: PropTypes.array.isRequired,
};
export default InstanceDetailsInfos;
