const createScaSummary = ({ finding, repository }) => {
  return `Vulnerable Library - ${repository.name}: ${finding.metadata.dependencyName}`;
};

const createGenericSummary = ({ finding, repository }) => {
  const title = finding.rule && finding.rule.title ? finding.rule.title : 'Vulnerability found';
  return `${title} in ${repository.name}/${finding.path}`;
};

const createFindingSummary = ({ finding, repository }) => {
  const hasDependencyContent = Boolean(finding.metadata && finding.metadata.dependencyName);

  if (hasDependencyContent) {
    return createScaSummary({ finding, repository });
  }

  return createGenericSummary({ finding, repository });
};

module.exports = createFindingSummary;
