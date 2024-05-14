/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useParamsObject } from './hooks/useParamsObject';
import { baseUrls } from '../constants/urls';
import { useSnackMutation } from '../libs/apiHooks';
import { postRequest } from '../libs/Api';

// Temporary fix to enable use of react-router 6 with DHIS2 Mapping component.
/** @deprecated */
const withParams = Component => {
    return function WrappedComponent(props) {
        const params = useParamsObject(baseUrls.mappings);
        return <Component params={params} {...props} />;
    };
};
// wrapped ParamsHOC to avoid rule of hooks error
export default withParams;

// export const withRedirectActions = Component => {
//     return function WrappedComponent(props) {
//         const redirectTo = useRedirectTo();
//         const redirectToReplace = useRedirectToReplace();
//         return (
//             <Component
//                 redirectTo={redirectTo}
//                 redirectToReplace={redirectToReplace}
//                 {...props}
//             />
//         );
//     };
// };

// export const withCreateMappingRequest = Component => {
//     return function WrappedComponent(props) {
//         const redirectTo = useRedirectTo();
//         const {
//             mutateAsync: createMappingRequest,
//             isLoading: isCreatingMapping,
//         } = useSnackMutation({
//             mutationFn: params => postRequest('/api/mappingversions/', params),
//             options: {
//                 onSuccess: res =>
//                     redirectTo(baseUrls.mappingDetail, {
//                         mappingVersionId: res.id,
//                     }),
//             },
//         });
//         return (
//             <Component
//                 mutateAsync={mutateAsync}
//                 isLoading={isLoading}
//                 {...props}
//             />
//         );
//     };
// };
