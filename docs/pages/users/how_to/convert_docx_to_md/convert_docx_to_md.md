# How to convert a .docx file to .md

- Install [pandoc](https://pandoc.org/installing.html)
- Add a copy of your `docx` file to `iaso/docs/originals`
- Create a folder for your file at the right place. E.g: If you want to create a how-to file for users, you would create the folder `iaso/docs/pages/users/how_to/my_new_page`. Make sure to use [snake_case](https://en.wikipedia.org/wiki/Snake_case) when naming your folder.
- In your `iaso/docs/pages/users/how_to/my_new_page` folder, create another `my_new_page` folder, and in this folder, a `media` folder. The full path to the media folder should be: `iaso/docs/pages/users/how_to/my_new_page/my_new_page/media`
- In `iaso/docs/pages/users/how_to/my_new_page/my_new_page`, run the following pandoc command: 
```bash
pandoc -s -f docx -t markdown_mmd --extract-media=. -o ./my_new_page.md ../../../../../originals/MyPage.docx
``` 
This will copy all the attached media of you `docx`file (like screenshots) in `iaso/docs/pages/users/how_to/my_new_page/my_new_page/media`, and create `my_new_page.md` in `iaso/docs/pages/users/how_to/my_new_page/my_new_page`
- Move `my_new_page.md` up one folder level. It should now sit in `iaso/docs/pages/users/how_to/my_new_page/`. These gymnastics happen because `pandoc` and `mkDocs` handle file paths differently
- Rename the `media` folder to `attachments`
- Open `my_new_pages.md`. search (ctrl+F/cmd+F) for the word "media" and replace it with "attachment" whenever it is a path to a file, eg:
```html
<!-->Initial value<-->
<img src="./media/image1.png"style="width:3.02211in;height:0.79688in" />
<!-->Correct value<-->
<img src="./attachments/image1.png"style="width:3.02211in;height:0.79688in" />
```
This is because `media` folders are not pushed on github, so if we don't rename it, the screenshots in your docs will be lost

- Go through `my_new_pages.md` and fix any layout issues that may have been caused by the conversion.
- Now you can add you page to the docs: go to `iaso/mkDocs.yml` and locate the `nav` entry. 
- Add you new page:
```yaml
nav:
  - Home: index.md
  - Users: 
    - References:
      - User guide:
        - ./pages/users/reference/user_guide/user_guide.md
      - How to:
        - ./pages/users/how_to/my_new_page.md #<-- Your page would go here
      - FAQ: ./pages/users/FAQ/faq.md
```