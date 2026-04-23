API 

This is a first draft on how to properly document our API and synchronize it with the front end

## Backend

### Setting up drf-spectacular
### Documenting your endpoint
### Testing the generated swagger schema


## Front end

### Orval

### Integrating

### Testing

#### With backend 
#### Without backend
## Documentation

## Known issues

* orval does not include zod parsing by default with react-query and custom fetch/mutators/httpClient... , it's WIP on their side https://github.com/orval-labs/orval/issues/2858
* orval does not include mutationInvalidates when using custom mutators, had to patch it; 

## Notes

Do we really need this custom mutation options just for snackbar ? could be set as query client default 

Not using useSearchparams makes the testing nearly impossible :/ 

right now we go : form => submit => redirect => API call and validate
I get we do this because of direct url access

with searchParams 

direct url access => api call and validate (useEffect with searchParams dep)
form submit : updateSearchParams (no harsh redirect) => API call and validate (useEffect with searchParams dep)