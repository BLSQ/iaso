import { useIntl } from 'react-intl';
import { patchIntl } from '../libs/intl/utils';

export const useSafeIntl = () => patchIntl(useIntl());
