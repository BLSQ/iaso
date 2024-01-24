# How to edit an existing page in iaso's documentation

## 1. To add only text

- On the readthedocs page, click "Edit on Github"
- Make the changes
- Click "Commit changes"
- Add a description of the changes (eg: "fix typo")
- Choose "Create new branch for this commit and start pull request"
- Change the name of the branch (eg to include he Jira ticket number)
- Click "Propose changes"

## 2. To add Text and images

For the text, see point 1 above.
For the images, add the images to the `/attachments/` folder of that document, eg, for user_guide:
```
> user_guide
    > attachments  // <-- there
    - user_guide.md
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

If the `/attachments/` folder doesn't exist, the change can't be made using Github's interface and should be made using git and an IDE/text editor