"use strict";
const getRuleDescription = require('./ruleDescription');
const NEW_LINE = '\n';
const link = (text, url) => {
    return `[${text}|${url}]`;
};
const createScaDescription = ({ finding, repository, dashboardLink, providerCodeLink }) => {
    const { path, lineNumber, branch, language, rule } = finding;
    const { patchedVersions, dependencyName } = finding.metadata;
    const result = ['Vulnerability Details:'];
    if (rule && rule.title) {
        result.push(`- ${link(rule.title, dashboardLink)}`);
    }
    result.push(`- Repository: ${link(repository.name, providerCodeLink)}`, `- Path: ${link(path, providerCodeLink)}`);
    if (lineNumber) {
        result.push(`- Line: ${link(lineNumber, providerCodeLink)}`);
    }
    result.push(`- Branch: ${link(branch, providerCodeLink)}`, `- Dependency Name: ${dependencyName}`, `- Solution: ${patchedVersions ? `Upgrade to ${patchedVersions}` : 'No patch available'}`);
    if (language && rule && rule.docs) {
        const docsUrl = `https://docs.guardrails.io/docs/en/vulnerabilities/${language}/${rule.docs}`;
        result.push(`- More information can be found ${link('here', docsUrl)}`);
    }
    if (rule && rule.name) {
        result.push('');
        result.push('Description:');
        result.push(getRuleDescription(rule.name));
    }
    return result.join(NEW_LINE);
};
const createGenericDescription = ({ finding, repository, dashboardLink, providerCodeLink }) => {
    const { path, lineNumber, branch, language, rule } = finding;
    const result = ['Vulnerability Details:'];
    if (rule && rule.title) {
        result.push(`- ${link(rule.title, dashboardLink)}`);
    }
    result.push(`- Repository: ${link(repository.name, providerCodeLink)}`, `- Path: ${link(path, providerCodeLink)}`);
    if (lineNumber) {
        result.push(`- Line: ${link(lineNumber, providerCodeLink)}`);
    }
    result.push(`- Branch: ${link(branch, providerCodeLink)}`);
    if (language && rule && rule.docs) {
        const docsUrl = `https://docs.guardrails.io/docs/en/vulnerabilities/${language}/${rule.docs}`;
        result.push(`- Solution: Follow the steps described ${link('here', docsUrl)}`);
    }
    if (rule && rule.name) {
        result.push('');
        result.push('Description:');
        result.push(getRuleDescription(finding.rule.name));
    }
    return result.join(NEW_LINE);
};
const createFindingDescription = ({ finding, repository, dashboardLink, providerCodeLink }) => {
    const hasDependencyContent = Boolean(finding.metadata && finding.metadata.dependencyName);
    if (hasDependencyContent) {
        return createScaDescription({ finding, repository, dashboardLink, providerCodeLink });
    }
    return createGenericDescription({ finding, repository, dashboardLink, providerCodeLink });
};
module.exports = createFindingDescription;
//# sourceMappingURL=description.js.map