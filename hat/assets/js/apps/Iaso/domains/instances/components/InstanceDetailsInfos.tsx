import React, { FunctionComponent } from 'react';
import get from 'lodash/get';
import { useSafeIntl } from 'bluesquare-components';
import InstanceDetailsField from './InstanceDetailsField';
import MESSAGES from '../messages';

type Props = {
    currentInstance: any;
    fieldsToHide?: any[];
    instance_metas_fields: any;
};
const InstanceDetailsInfos: FunctionComponent<Props> = ({
    currentInstance,
    fieldsToHide = [],
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
                                'getLabelKey' in f
                                    ? f.getLabelKey(currentInstance)
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

export default InstanceDetailsInfos;
