## Configuring Black Auto-formatting in VS Code

To set up automatic formatting with Black in Visual Studio Code:

1. Install the "Black Formatter" extension in VS Code:
   - Open VS Code
   - Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on Mac)
   - Search for "Black Formatter"
   - Click "Install" for the extension by Microsoft

2. Create a `.vscode/settings.json` file in your project root if it doesn't exist.

3. Add the following to `settings.json`:

   ```json
   {
        "editor.formatOnSave": true,
        "[python]": {
            "editor.defaultFormatter": "ms-python.black-formatter",
            "editor.formatOnSave": true
        },
        "black-formatter.args": ["--config", "${workspaceFolder}/pyproject.toml"],
        "black-formatter.path": ["${workspaceFolder}/.venv/bin/black"]
    }

   ```

4. Set up and activate your virtual environment:

   ```
   python3.9 -m venv .venv
   source .venv/bin/activate
   ```

5. Install development requirements, which include Black:

   ```
   pip install -r requirements-dev.txt
   ```

   This ensures you're using the version of Black specified in the project's requirements.

6. (Optional) If you want to exclude certain directories from formatting, you can add them to a `.vscode/.prettierignore` file:

   ```
   .git
   .venv
   venv
   node_modules
   ```

Now, VS Code will automatically format your Python files using Black when you save them, using the settings specified in your `settings.json` file and the version of Black specified in your project's requirements.

Note: This configuration is local to your VS Code environment and won't affect other developers or CI processes that might use the `pyproject.toml` file.