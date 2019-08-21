const crypto = require("crypto");
const { GraphQLClient } = require("graphql-request");
require("dotenv").config({ path: `${__dirname}/.env` });
const sources = require("./sources");

// Helpers
const isObject = val =>
  val != null && typeof val === "object" && Array.isArray(val) === false;
const trim = p => p.replace(/\/+$/, "").replace(/^\//, "");

exports.onCreateNode = (
  { node, getNode, actions, createNodeId },
  { proxyType = `GitHubReadmeDocPost` }
) => {
  if (node.internal.type === `Mdx`) {
    const parent = getNode(node.parent);

    if (parent.internal.type === `GitHubReadmeMdx`) {
      const { frontmatter } = node;

      const fieldData = {
        title: frontmatter.title,
        slug: frontmatter.slug || node.id
      };

      const { createNode, createParentChildLink } = actions;

      createNode({
        ...fieldData,
        id: createNodeId(`${node.id} >>> ${proxyType}`),
        parent: node.id,
        children: [],
        internal: {
          type: proxyType,
          contentDigest: crypto
            .createHash(`md5`)
            .update(node.internal.content)
            .digest(`hex`),
          content: node.internal.content,
          description: `Proxy node for DocPost interface`
        }
      });

      createParentChildLink({ parent, child: node });
    }
  }
};

exports.sourceNodes = async (
  { actions, schema, createNodeId },
  { proxyType = `GitHubReadmeDocPost` }
) => {
  const { createNode, createTypes } = actions;

  createTypes(
    schema.buildObjectType({
      name: proxyType || `GitHubReadmeDocPost`,
      extensions: ["infer"],
      fields: {
        id: { type: `ID!` },
        title: {
          type: "String!"
        },
        slug: {
          type: "String!"
        },
        body: {
          type: "String!",
          resolve(source, _, context, info) {
            const type = info.schema.getType(`Mdx`);
            const mdxNode = context.nodeModel.getNodeById({
              id: source.parent
            });
            const resolver = type.getFields()["body"].resolve;
            return resolver(mdxNode, {}, context, {
              fieldName: "body"
            });
          }
        }
      },
      interfaces: [`Node`, `DocPost`]
    })
  );

  const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      authorization: `Bearer ${process.env.GITHUB_USER_TOKEN}`
    }
  });

  sources.map(async source => {
    let query = `query {repository(name:"${source.repo}",owner:"${
      source.owner
    }"){`;

    let files = [];

    source.files.map(file => {
      let f = file;
      if (!isObject(file)) {
        f = {
          branch: "master",
          path: file,
          slug: file.split(".")[0].toLowerCase()
        };
      }

      const ref = trim(f.slug).replace("-", "_");
      files.push({
        ...f,
        ref
      });

      query += `${ref}: object(expression: "${f.branch}:${f.path}") {
                ... on Blob {
                   text
                }
            }`;
    });

    query += `}}`;

    const data = await graphQLClient.request(query);

    files.forEach(file => {
      const content = data.repository[file.ref].text;

      const mdxContent = `---\ntitle: ${file.title || file.path}\nslug: /${trim(file.slug)}/\n---\n${content}`;

      createNode({
        id: createNodeId(
          `${crypto
            .createHash("md5")
            .update(mdxContent)
            .digest("hex")} >>> GitHubReadmeMdx`
        ),
        parent: null,
        children: [],
        internal: {
          type: `GitHubReadmeMdx`,
          contentDigest: crypto
            .createHash(`md5`)
            .update(mdxContent)
            .digest(`hex`),
          mediaType: `text/markdown`,
          content: mdxContent,
          description: `Satisfies the DocPost interface.`
        }
      });
    });
  });
};
