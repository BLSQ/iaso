import { getRequest, patchRequest, postRequest } from "../../libs/Api";
import { enqueueSnackbar } from "../../../../redux/snackBarsReducer";
import { errorSnackBar } from "../../../../utils/constants/snackBars";
import Descriptor from "./descriptor";

export const FETCHING_MAPPING_VERSIONS = "FETCHING_MAPPING_VERSIONS";

// EDIT a mapping version
export const SET_MAPPING_VERSIONS = "SET_MAPPING_VERSIONS";
export const SET_CURRENT_MAPPING_VERSION = "SET_CURRENT_MAPPING_VERSION";
export const SET_CURRENT_FORM_VERSION = "SET_CURRENT_FORM_VERSION";
export const SET_CURRENT_QUESTION = "SET_CURRENT_QUESTION";
export const SET_HESABU_DESCRIPTOR = "SET_HESABU_DESCRIPTOR";

// create a mapping version
export const SET_MAPPING_SOURCES = "SET_MAPPING_SOURCES";

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

export const setMappingSources = sources => ({
  type: SET_MAPPING_SOURCES,
  payload: sources
});


export const setCurrentFormVersion = formVersion => ({
  type: SET_CURRENT_FORM_VERSION,
  payload: formVersion
});

export const setCurrentQuestion = question => ({
  type: SET_CURRENT_QUESTION,
  payload: question
});

export const setHesabuDescriptor = descriptor => ({
  type: SET_HESABU_DESCRIPTOR,
  payload: descriptor
});

export const applyPartialUpdate = (
  mappingVersionId,
  questionName,
  mapping
) => dispatch => {
  dispatch(fetchingMappingVersions(true));
  return patchRequest(`/api/mappingversions/${mappingVersionId}/`, {
    question_mappings: {
      [questionName]: mapping
    }
  })
    .then(() =>
      dispatch(fetchMappingVersionDetail(mappingVersionId, questionName))
    )
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar("fetchMappingsError"))))
    .then(() => {
      dispatch(fetchingMappingVersions(false));
    });
};

export const fetchFormVersionDetail = (id, questionName) => dispatch => {
  return getRequest(`/api/formversions/${id}.json?fields=:all`).then(
    formVersion => {
      dispatch(setCurrentFormVersion(formVersion));
      const indexedQuestions = Descriptor.indexQuestions(
        formVersion.descriptor
      );
      return dispatch(setCurrentQuestion(indexedQuestions[questionName]));
    }
  );
};

export const fetchHesabuDescriptor = dataSourceId => dispatch => {
  return getRequest(
    `/api/datasources/${dataSourceId}/hesabudescriptors.json?fields=:all`
  ).then(answer => {
    dispatch(setHesabuDescriptor(answer.hesabudescriptors));
  });
};

export const fetchMappingVersionDetail = (
  mappingVersionId,
  questionName
) => dispatch => {
  dispatch(fetchingMappingVersions(true));
  return getRequest(`/api/mappingversions/${mappingVersionId}.json?fields=:all`)
    .then(detail => {
      dispatch(fetchFormVersionDetail(detail.form_version.id, questionName));
      dispatch(fetchHesabuDescriptor(detail.mapping.data_source.id));
      return dispatch(setCurrentMappingVersion(detail));
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

export const createMappingRequest = params => dispatch => {
  dispatch(fetchingMappingVersions(true));
  return postRequest(`/api/mappingversions/`, params)
    .then(res => dispatch(setMappingVersions(res)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar("fetchMappingsError"))))
    .then(() => {
      dispatch(fetchingMappingVersions(false));
    });
};

export const fetchSources = params => dispatch => {
  return getRequest("/api/datasources/")
    .then(res => dispatch(setMappingSources(res.sources)))
    .catch(error => {
      dispatch(enqueueSnackbar(errorSnackBar("fetchSourcesError")));
      console.error("Error while fetching source list:", error);
      throw error;
    });
};
