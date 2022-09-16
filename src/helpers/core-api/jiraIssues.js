const get = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { jiraIssueFragment } = require('./fragments');

const findJiraIssueByFinding = async idFinding => {
  const query = gql`
    query($fkFinding: UUID!) {
      jiraIssues(condition: { fkFinding: $fkFinding, deletedAt: null }) {
        nodes {
          ...JiraIssueFragment
        }
      }
    }
    ${jiraIssueFragment}
  `;

  const variables = { fkFinding: idFinding };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  const jiraIssues = get(data, 'data.jiraIssues.nodes', []);

  if (jiraIssues.length > 1) {
    // We have a constraint in the database that prevents multiple jira issues from being
    // associated with the same finding. So if this happens we have made some error in the query.
    throw new Error(`Found multiple jira issues for the same finding. Finding was ${idFinding}.`);
  }

  return jiraIssues[0];
};

const createJiraIssue = async jiraIssue => {
  const query = gql`
    mutation createJiraIssue($input: CreateJiraIssueInput!) {
      createJiraIssue(input: $input) {
        jiraIssue {
          ...JiraIssueFragment
        }
      }
    }
    ${jiraIssueFragment}
  `;

  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: {
      input: {
        jiraIssue: {
          ...jiraIssue,
          createdAt: new Date().toJSON(),
          updatedAt: new Date().toJSON()
        }
      }
    }
  });

  return get(data, 'data.createJiraIssue.jiraIssue');
};

module.exports = {
  createJiraIssue: wrapper(createJiraIssue),
  findJiraIssueByFinding: wrapper(findJiraIssueByFinding)
};
