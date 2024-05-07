/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { Chip, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import MESSAGES from '../messages';

import { FeatureFlag } from '../types/featureFlag';

export type Form = {
    value: Array<string>;
    errors: Array<string>;
};

type ProjectForm = {
    feature_flags: Form;
};

type Props = {
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: string) => void;
    currentProject: ProjectForm;
    featureFlags?: Array<FeatureFlag>;
    isFetchingFeatureFlag: boolean;
};

const renderOption = (props, option) => (
    <Tooltip key={option.value} title={option.tooltip} disableInteractive>
        <span {...props}>{option.label}</span>
    </Tooltip>
);

const renderTags = (value, getTagProps) =>
    value.map((option, index) => (
        <Tooltip
            key={option.value}
            title={option.tooltip}
            placement="bottom-end"
            disableInteractive
        >
            <Chip
                color="primary"
                label={option.label}
                {...getTagProps({ index })}
            />
        </Tooltip>
    ));

const ProjectFeatureFlags: FunctionComponent<Props> = ({
    setFieldValue,
    currentProject,
    featureFlags,
    isFetchingFeatureFlag,
}) => {
    const { formatMessage } = useSafeIntl();
    const options = React.useMemo(
        () =>
            featureFlags?.map(fF => {
                return {
                    label: fF.name,
                    value: fF.id,
                    tooltip:
                        formatMessage(
                            MESSAGES[`${fF.code.toLowerCase()}_tooltip`],
                        ) || fF.name,
                };
            }),
        [featureFlags, formatMessage],
    );

    return (
        <InputComponent
            multi
            clearable
            keyValue="feature_flags"
            loading={isFetchingFeatureFlag}
            onChange={(key, value) =>
                setFieldValue(key, commaSeparatedIdsToArray(value))
            }
            value={currentProject.feature_flags.value.join(',')}
            errors={currentProject.feature_flags.errors}
            type="select"
            options={options}
            label={MESSAGES.featureFlags}
            renderOption={renderOption}
            renderTags={renderTags}
        />
    );
};

export { ProjectFeatureFlags };
