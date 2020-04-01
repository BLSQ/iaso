import { getRequest } from "../../libs/Api";
import { enqueueSnackbar } from "../../../../redux/snackBarsReducer";
import { errorSnackBar } from "../../../../utils/constants/snackBars";

export const SET_MAPPING_VERSIONS = "SET_MAPPING_VERSIONS";
export const SET_CURRENT_MAPPING_VERSION = "SET_CURRENT_MAPPING_VERSION";
export const SET_CURRENT_FORM_VERSION = "SET_CURRENT_FORM_VERSION";
export const FETCHING_MAPPING_VERSIONS = "FETCHING_MAPPING_VERSIONS";

export const fetchingMappingVersions = fetching => ({
  type: FETCHING_MAPPING_VERSIONS,
  payload: fetching
});

export const setMappingVersions = ({ mapping_versions, count, pages }) => ({
  type: SET_MAPPING_VERSIONS,
  payload: {
    mappingVersions: mapping_versions,
    count,
    pages
  }
});

export const setCurrentMappingVersion = mapping => ({
  type: SET_CURRENT_MAPPING_VERSION,
  payload: mapping
});

export const setCurrentFormVersion = formVersion => ({
  type: SET_CURRENT_FORM_VERSION,
  payload: formVersion
});

export const fetchFormVersionDetail = id => dispatch => {
  return getRequest(
    `/api/formversions/${id}.json?fields=:all`
  ).then(formVersion => dispatch(setCurrentFormVersion(formVersion)));
};

export const fetchMappingVersionDetail = params => dispatch => {
  dispatch(fetchingMappingVersions(true));
  return getRequest(`/api/mappingversions/${params}.json?fields=:all`)
    .then(res => {
      dispatch(fetchFormVersionDetail(res.form_version.id));
      return dispatch(setCurrentMappingVersion(res));
    })
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar("fetchMappingsError"))))
    .then(() => {
      dispatch(fetchingMappingVersions(false));
    });
};

export const fetchMappingVersions = params => dispatch => {
  dispatch(fetchingMappingVersions(true));
  return getRequest(
    `/api/mappingversions/?order=${params.order}&limit=${params.pageSize}&page=${params.page}`
  )
    .then(res => dispatch(setMappingVersions(res)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar("fetchMappingsError"))))
    .then(() => {
      dispatch(fetchingMappingVersions(false));
    });
};
