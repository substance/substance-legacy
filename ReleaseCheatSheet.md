Release Workflow
================

Checkout `release`:

    ./update.py --git checkout release

Merge `master`: the release branch is a rather weak. It should contain only updates of the module versions
in `package.json` files (version property and dependencies).

    ./update.py --git merge master

Now, update the `package.json` files, commit and maybe create tags.


Publish the npm modules.

    ./update.py --publish --force

Push the released git repos

    ./update.py --git push origin release

Finally, switch back to `master`:

    ./update.py --git checkout master
