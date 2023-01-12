# Mermaid generation tool.

Generally the syntax is:

```bash
python mermaid.py <PROJECT_NAME> <SELECTION> <OUTPUT_FILE_NAME>
```

Where:

  * `PROJECT_NAME` is the name of the django project 
  * `SELECTION` is the selection of django models to process, it can be:
    * A comma separated list of models to be processed : Example: `Model1,Model2`
    * A path of the models modules ending with a * : Example: `myapp.models.*`
  * `OUTPUT_FILE_NAME` is the name of the output file (without the .md) at the end.

Here are two examples concrete example of using the tools in this project :

```bash
python mermaid.py hat Workflow,WorkflowVersion,WorkflowFollowup,WorkflowChange,EntityType,Form,FormVersion, workflows
```

```bash
python mermaid.py hat iaso.models.* iaso
```

You can find the output in the schemas folder

If you want to generate SVG files from the MD files, you need to install a node tool called `mermaid-cli`

Install it via : `npm install -g @mermaid-js/mermaid-cli`


Then you can generate the SVG files with the following command:

```bash
 cd schemas
 mmdc -i workflows.md -o workflows.svg -t dark
```

Or more generally :

```bash
 cd schemas
 mmdc -i <INPUT_FILE_NAME>.md -o <OUTPUT_FILE_NAME>.svg -t dark
```