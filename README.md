# @readysteady/gatsby-theme-github-readme

---

*Work in progres...*

This theme is meant to be used with other theme that defines the interface for a `DocPost` type.

```
createTypes(`interface DocPost @nodeInterface {
        id: ID!
        title: String
        body: String!
        parent: Node
        slug: String!
        internal: Internal!
    }`)
```

To use this theme as is:

* copy `.env.example` to `.env` and add your GitHub token
* modify `sources.js` to point to the repos and the files within those repos to source them as nodes.

Example:

```
module.exports = [
    {
        repo: 'gatsby',
        owner: 'gatsbyjs',
        files: [
            {
                title: "The GatsbyJS Readme File",
                branch: 'master',
                path: 'README.md',
                slug: '/gatsby-readme/'
            },
            'CONTRIBUTING.md',
        ]
    },
    {
        repo: 'gatsby-theme-github-readme',
        owner: 'rheinardkorf',
        files: ['README.md']
    }
]
```

Sources expects an array of objects that define:

|key|description|
|---|-----------|
|`repo`| The repo name without the owner. |
|`owner`| The repo owner. |
|`files`| An array of `file` objects. (see below)  |

Attributes for `file` objects are:

|key|description|default|
|---|-----------|-------|
|`title`| A title given to the new node. | Filename |
|`branch`| The branch on the repo to source from. | `master` |
|`path`| The relative path in the repo.  | Filename |
|`slug`| A slug for the new node. | "Slugified" Filename |