# Background tasks & worker

Iaso queue certains functions (task) for later execution, so they can run
outside an HTTP request. This is used for functions that take a long time to execute
so they don't canceled in the middle by a timeout of a connection closed.
e.g: bulk import, modifications or export of OrgUnits.  Theses are the functions
marked by the decorator @task_decorator, when called they get added to a Queue
and get executed by a worker.


The logic is based on a fork of the library
[django-beanstalk-worker](https://pypi.org/project/django-beanstalk-worker/)
from tolomea, please consult it's doc for reference.


If you want to develop a new background task, the endpoint `/api/copy_version/`
is a good example of how to create a task and to plug it to the api.

To call a  function with the @task decorator, you need to pass it a User objects, in addition to
the other function's arguments, this arg represent which user is launching
the task. At execution time the task will receive a iaso.models.Task
instance in argument that should be used to report progress. It's
mandatory for the function, at the end of a successful execution to call
task.report_success() to mark its proper completion.