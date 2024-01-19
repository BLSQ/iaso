import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { injectIntl } from 'bluesquare-components';
import InstanceDetailsField from './InstanceDetailsField';
import { INSTANCE_METAS_FIELDS } from '../constants';
import MESSAGES from '../messages';
import { LinkToInstance } from './LinkToInstance.tsx';

const InstanceDetailsInfos = ({
    currentInstance,
    intl: { formatMessage },
    fieldsToHide,
    displayLinktoInstance,
}) => {
    const fields = INSTANCE_METAS_FIELDS.filter(
        f =>
            f.type === 'info' &&
            !fieldsToHide.includes(f.translationKey ?? f.key),
    );
    return (
        <>
            {displayLinktoInstance && (
                <InstanceDetailsField
                    renderValue={() => (
                        <LinkToInstance instanceId={currentInstance.id} />
                    )}
                    label={formatMessage(MESSAGES.submission)}
                />
            )}
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
    displayLinktoInstance: false,
};

InstanceDetailsInfos.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fieldsToHide: PropTypes.array,
    displayLinktoInstance: PropTypes.bool,
};
export default injectIntl(InstanceDetailsInfos);
