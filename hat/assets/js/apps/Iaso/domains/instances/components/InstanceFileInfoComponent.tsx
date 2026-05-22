import React, { FunctionComponent, useMemo } from 'react';
import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { useLocale } from 'Iaso/domains/app/contexts/LocaleContext';
import { Descriptor } from 'Iaso/domains/instances/components/InstanceFileContentRich';
import { Instance } from 'Iaso/domains/instances/types/instance';
import {
    translateLabel,
    findDescriptor,
} from 'Iaso/domains/instances/utils/questions';

type Props = {
    filePath: string;
    instanceDetail: Instance;
    showQuestionId?: boolean;
};

const InfoComponent: FunctionComponent<Props> = ({
    filePath,
    instanceDetail,
    showQuestionId = false,
}) => {
    const question: Descriptor | undefined = useMemo(() => {
        return findDescriptor(instanceDetail, filePath);
    }, [instanceDetail, filePath]);

    const { locale: activeLocale } = useLocale();

    return (
        <div
            style={{
                fontWeight: 'bold',
                height: '40px',
                lineHeight: '40px',
            }}
        >
            {question?.label
                ? `${translateLabel(question.label, activeLocale) + (showQuestionId ? ` (${question.name})` : '')}`
                : textPlaceholder}
        </div>
    );
};

export default InfoComponent;
