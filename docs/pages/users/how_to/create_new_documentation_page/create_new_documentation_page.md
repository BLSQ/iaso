# How to add a new page to Iaso's documentation


## 1. Determine where the page belongs
To determine where a new documentation page fits, there are 2 questions to answer:
- Who is it intended for?
- What kind of document is it?

We currently have 2 categories of documentation users: developers and users. This will determine the style of the writing and the assumptions  you can make in terms of, eg prior knowledge of the product.

We determine the kind of document using the [diataxis framework](https://diataxis.fr/). Basically, the idea is to ask what the goal of the document is. A simple rule of thumb is:
- Give instructions about how to perform a task, eg: how do I login? -> how to
- Explanation of concepts, eg: what is an org unit type? -> reference
- Explanation on choices made for some implementation, eg: why do we use react-query for API calls? -> explanation

Once we know who the document is intended for and what kind of document it is, we just need to follow the folder structure.
For example, this document is intended for users and aims to explain how to create a new page in the documentation, so it will go in:

```
> pages
    > users
        > how_to
```

There is an exception for the FAQ whixh we keep separate and visible for convenience

## 2. Create a branch on git for the new document

Ideally, there will be a Jira ticket for the changes about to be made. It should be used to name the branch, as it will enable Jira to directly link the ticket to the branch.
For example, the development branch for this document is called `IA-2630_how_to_write_iaso_doc`

To create the branch:
- Open a terminal
- Make sure you are on main. If not run `git checkout main`
- Run `git checkout -b <Branch name>`. This will create the branch and switch to it

## 3. Create folder and markdown file

By convention, we create a folder with the same name as the markdown file. 
For example, this document is in:

```
> pages
    > users
        > how_to
            > create_new_documentation_page
                - create_new_documentation_page.md
```

## 4. Write the doc

Format the text using [markdown syntax](https://www.markdownguide.org/cheat-sheet/)

### 4.1. Add images

- Add a folder called `/attachments/` in the document's folder and move the images there
```
> pages
    > users
        > how_to
            > create_new_documentation_page
                > attachments
                - create_new_documentation_page.md
```

To add the image in the markdown file, either:
- use markdown syntax to add the link `![my_image](./attachments/my_image.png)`
- use an html `img` tag:
```html
<img src="./attachments/image49.png" />
```

The markdown syntax is less cumbersome if the image is already at the right size. The `img` tag allows for manually setting the image width and heigh via the `style` attribute:
```html
<img src="./attachments/image49.png" style="width:50px;height:50px" />
```

## 5. Push the changes on Github

Once the document is ready, the changes need to be saved on the git branch, then pushed on Github, so they can be reviewed and merged.
There are tools to make this part faster and easier to manage ([Github desktop](https://desktop.github.com/), or even just the git ineterface of [VS Code](https://code.visualstudio.com/)), but if it needs to be done in the terminal (from the document's branch):
- `git add .`
- `git commit -m <commit message>`
- `git push`

## 6. Open the Pull Request

Pull requests are the process through which we review code. Since the documentation is hosted as part of the code, it's going through the same review process, though not necessarily by the same persons.

To open a pull request:
- Go to [iaso's pull requests](https://github.com/BLSQ/iaso/pulls)
- Click New pull request
- Select a branch
- Describe the changes. The description template can be ignored for documentation changes, but please leave a description, as it helps tracking and understanding changes.

## 7. Review a pull request

Pull requests are peer-reviews that insure that all changes are cross-checked, so one should not merge their own pull requests.

To review a pull request:
- Go to [iaso's pull requests](https://github.com/BLSQ/iaso/pulls)
- Click in the pull request
- Click "Add your review"
- Review the changes, comment where necessary
- To finish the review, click "Review changes"
    - If the changes can be deployed as they are, choose "Approve"
    - If not, explain what needs to be corrected and chooses "Request changes"
- If the PR has been approved, go the "Conversation" tab of the PR, scroll down and click "Merge pull request"

The changes will be visible in production after the next release of iaso.