"""
Release script
"""

import re
import os
import shutil

from git import Repo

# Only this files should be changed on a release commit
ALLOWED_FILES = ['betterrolls-swade2/module.json', 'CHANGELOG.md', 'README.md']

# Get a list of the modified files
repo = Repo(".")
differences = repo.head.commit.diff()
modified_files = list(map(lambda x:x.a_path, differences))
if len(modified_files) != len(ALLOWED_FILES):
    print('The number of modified files should be {}'.format(
        len(ALLOWED_FILES)))
    raise SystemExit(0)
# Get the version from modules.json
with open("betterrolls-swade2/module.json") as f:
    manifest = f.read()
version_search = re.search(r'version\": \"(\d+\.\d+\.\d+)', manifest)
version = version_search.group(1)
print("Version: {}".format(version))
# Delete and rezip the module
if os.path.isfile('betterrolls-swade.zip'):
    os.remove('betterrolls-swade.zip')
shutil.make_archive('betterrolls-swade2', 'zip', 'betterrolls-swade2')
# Commit the release, but don't push it.
repo.index.commit("Release {}".format(version))
repo.create_tag("Release_{}".format(version))
