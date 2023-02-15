# Test plugin

This is a demo plugin to demonstrate how the v2 plugin system in Iaso works.

It creates a new model BlogPost, that can be managed in admin and expose it via API an endpoint. In the web interface, it
adds a `test` entry and a new page showing the list of Posts.

To activate it set the environment variable `ENV` to `test`. You can do so either in your `.env` file or by remoting  

* Add new blogposts entries via the admin http://localhost:8081/admin/test/blogpost/
* View them in the web interface  : http://localhost:8081/dashboard/test
* Explore the API : http://localhost:8081/api/test/blogpost/


It is also possible to load a sample blogpost using : `./manage.py loaddata plugins/test/sample_data.yaml`
