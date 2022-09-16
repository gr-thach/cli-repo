const {
  assertAccountsHasMatchingOrgProject,
  assertIsBitbucketOrgProjects,
  assertIsBitbucketOrgProject,
  assertAccountMatchesOrgProject,
  assertIsBitbucketPersonalProject,
  assertAccountMatchesPersonalProject
} = require('../../src/helpers/assertBitbucketDataCenter');

describe('assertBitbucketDataCenter', () => {
  describe('assertIsBitbucketOrgProject', () => {
    it('A valid Bitbucket data center organization project should pass the assertion', async () => {
      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      assertIsBitbucketOrgProject(project);
    });

    it("An undefined Bitbucket data center organization project shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = undefined;

      try {
        assertIsBitbucketOrgProject(project);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center project to be defined.');
      }
    });

    it("A Bitbucket data center organization project without an id shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertIsBitbucketOrgProject(project);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center project to have an id.');
      }
    });

    it("A Bitbucket data center organization project without a project key shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        id: 123,
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertIsBitbucketOrgProject(project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (123) to have a project key.'
        );
      }
    });

    it("A Bitbucket data center organization project with type set as PERSONAL shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertIsBitbucketOrgProject(project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (123) to be of type NORMAL, got PERSONAL.'
        );
      }
    });
  });

  describe('assertIsBitbucketPersonalProject', () => {
    it('A valid Bitbucket data center personal project should pass the assertion', async () => {
      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      assertIsBitbucketPersonalProject(project);
    });

    it("An undefined Bitbucket data center personal project shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = undefined;

      try {
        assertIsBitbucketPersonalProject(project);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center personal project to be defined.');
      }
    });

    it("A Bitbucket data center personal project without an id shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertIsBitbucketPersonalProject(project);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center personal project to have an id.');
      }
    });

    it("A Bitbucket data center personal project without a project key shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        id: 789,
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertIsBitbucketPersonalProject(project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to have a project key.'
        );
      }
    });

    it("A Bitbucket data center personal project with type set as NORMAL shouldn't pass assertion", async () => {
      expect.hasAssertions();

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'NORMAL'
      };

      try {
        assertIsBitbucketPersonalProject(project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to be of type PERSONAL, got NORMAL.'
        );
      }
    });
  });

  describe('assertAccountsHasMatchingOrgProject', () => {
    it('should pass assertion if all accounts matches a corresponding Bitbucket data center organization project', async () => {
      const accounts = [
        {
          idAccount: 2,
          providerInternalId: '123',
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '345',
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '234',
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        }
      ];
      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          id: 234,
          key: 'TP2',
          name: 'test-project-2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      assertAccountsHasMatchingOrgProject(accounts, projects);
    });

    it("shouldn't pass assertion when an account doesn't have a matching Bitbucket data center organization project", async () => {
      expect.hasAssertions();

      const accounts = [
        {
          idAccount: 2,
          providerInternalId: '123',
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '999', // <-- This should throw an error as there isn't a matching Bitbucket data center project.
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        },
        {
          idAccount: 3,
          providerInternalId: '234',
          provider: 'BITBUCKET_DATA_CENTER',
          type: 'ORGANIZATION'
        }
      ];
      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          id: 234,
          key: 'TP2',
          name: 'test-project-2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      try {
        assertAccountsHasMatchingOrgProject(accounts, projects);
      } catch (err) {
        expect(err.message).toBe(
          'Expected to find a matching Project for account (3) but non was found.'
        );
      }
    });
  });

  describe('assertAccountMatchesOrgProject', () => {
    it('should pass assertion as account matches Bitbucket data center organization project.', async () => {
      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      assertAccountMatchesOrgProject(account, project);
    });

    it("shouldn't pass assertion as providerInternalId doesn't match Bitbucket data center organization project.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '999',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertAccountMatchesOrgProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected account (2, 999, ORGANIZATION, BITBUCKET_DATA_CENTER) to match Bitbucket data center project (123).'
        );
      }
    });

    it("shouldn't pass assertion as provider isn't BITBUCKET_DATA_CENTER.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'GITLAB',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertAccountMatchesOrgProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected organization account provider to be BITBUCKET_DATA_CENTER'
        );
      }
    });

    it("shouldn't pass assertion as account isn't an organization.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 123,
        key: 'TP',
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertAccountMatchesOrgProject(account, project);
      } catch (err) {
        expect(err.message).toBe('Expected organization account to be of type ORGANIZATION');
      }
    });

    it("shouldn't pass assertion as Bitbucket data center organization project doesn't have a name.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 123,
        key: 'TP',
        type: 'NORMAL'
      };

      try {
        assertAccountMatchesOrgProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (123) to not have a project name.'
        );
      }
    });

    it("shouldn't pass assertion as Bitbucket data center organization project doesn't have a project key.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '123',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 123,
        name: 'test-project',
        type: 'NORMAL'
      };

      try {
        assertAccountMatchesOrgProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (123) to have a project key.'
        );
      }
    });
  });

  describe('assertAccountMatchesPersonalProject', () => {
    it('should pass assertion as account matches Bitbucket data center personal project.', async () => {
      const account = {
        idAccount: 3,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      assertAccountMatchesPersonalProject(account, project);
    });

    it("shouldn't pass assertion as providerInternalId doesn't match Bitbucket data center personal project.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '999',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected account (2, 999, USER, BITBUCKET_DATA_CENTER) to match Bitbucket data center project (789).'
        );
      }
    });

    it("shouldn't pass assertion as provider isn't BITBUCKET_DATA_CENTER.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'GITLAB',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe('Expected user account provider to be BITBUCKET_DATA_CENTER');
      }
    });

    it("shouldn't pass assertion as account isn't of type USER.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'ORGANIZATION'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe('Expected user account to be of type USER');
      }
    });

    it("shouldn't pass assertion as Bitbucket data center personal project doesn't have a name.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to not have a project name.'
        );
      }
    });

    it("shouldn't pass assertion as Bitbucket data center personal project doesn't have a project key.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        name: 'test-user',
        type: 'PERSONAL',
        owner: {
          id: 9
        }
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to have a project key.'
        );
      }
    });

    it("shouldn't pass assertion as Bitbucket data center personal project doesn't have an owner.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL'
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to have an owner defined.'
        );
      }
    });

    it("shouldn't pass assertion as Bitbucket data center personal project doesn't have an owner id.", async () => {
      expect.hasAssertions();

      const account = {
        idAccount: 2,
        providerInternalId: '789',
        provider: 'BITBUCKET_DATA_CENTER',
        type: 'USER'
      };

      const project = {
        id: 789,
        key: 'TU',
        name: 'test-user',
        type: 'PERSONAL',
        owner: {}
      };

      try {
        assertAccountMatchesPersonalProject(account, project);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center personal project (789) to have an owner id defined.'
        );
      }
    });
  });

  describe('assertIsBitbucketOrgProjects', () => {
    it('should pass assertion as all projects are valid Bitbucket data center organization projects.', async () => {
      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          id: 234,
          key: 'TP2',
          name: 'test-project-2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      assertIsBitbucketOrgProjects(projects);
    });

    it("shouldn't pass assertion as one organization project doesn't have a id.", async () => {
      expect.hasAssertions();

      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          key: 'TP2',
          name: 'test-project-2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      try {
        assertIsBitbucketOrgProjects(projects);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center project to have an id.');
      }
    });

    it("shouldn't pass assertion as one organization project doesn't have a name.", async () => {
      expect.hasAssertions();

      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          id: 234,
          key: 'TP2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      try {
        assertIsBitbucketOrgProjects(projects);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (234) to not have a project name.'
        );
      }
    });

    it("shouldn't pass assertion as one organization project doesn't have a key.", async () => {
      expect.hasAssertions();

      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        {
          id: 234,
          name: 'test-project-2',
          type: 'NORMAL'
        },
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      try {
        assertIsBitbucketOrgProjects(projects);
      } catch (err) {
        expect(err.message).toBe(
          'Expected Bitbucket Data Center project (234) to have a project key.'
        );
      }
    });

    it("shouldn't pass assertion as one organization project is undefined.", async () => {
      expect.hasAssertions();

      const projects = [
        {
          id: 123,
          key: 'TP',
          name: 'test-project',
          type: 'NORMAL'
        },
        undefined,
        {
          id: 345,
          key: 'BI',
          name: 'business intelligence',
          type: 'NORMAL'
        }
      ];

      try {
        assertIsBitbucketOrgProjects(projects);
      } catch (err) {
        expect(err.message).toBe('Expected Bitbucket Data Center project to be defined.');
      }
    });
  });
});
