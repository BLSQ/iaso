Github flow
===========

## Create and merge a pull request

- Make a new branch using the name of the JIRA issue in title
- Make sure you fill up all sections of the template (changes, how to test, ...)
- For any new feature make sure you wrote enough python or cypress tests 
- To be mergeable your PR needs to pass build, JS and Python tests.
- You can also launch Cypress test manually to make sure you didn't brake something else just by tagging `@cypress` in a comment on your PR
- Add reviewer(s) to make sure someone is gonna take care of it
- Merge main in your branch if you have conflicts (we are not doing rebase)
- If a reviewer request changes apply the changes and mark the discussion on github as resolved when fixed. It will help other reviewers to see if the changes has been done.
- Re-request a review when all changes are pushed (double check tests again)
- Wait at least that one reviewer approved the PR and merge the thing
- Add documentation when necessary (new feature, change in config, etc)


## Review a pull request:

- Go to all modified files and parse the code
- You can write your remarks or change requests directly on the files
- For each file, click on viewed checkbox while you reviewed it. This can help you to show changes on files after the author fixed your change requests
- Pull the branch and test the feature locally
- Approve/comment/request changes while you are done
- Restart the proccess if the author re-request a review


## Tips

- You can always write a draft PR to run the tests or share a discussion with other developers 
- To make sure your PR will pass in the next release you can add the `release` label to it
- You can add comments on a file or on multiple lines
- Black formatting is not automatic on new migration files
- You can access to the pull requests where your review is requested [here](https://github.com/pulls/review-requested)
- When reviewing a PR and adding comments, you can inline a suggestion with the `suggestion` block. More information can be found [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request#adding-comments-to-a-pull-request) on point 6.