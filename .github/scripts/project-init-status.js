const ORG = "a-dermendjiev";
const PROJECT_NUMBER = 2;

const REQUIRED_OPTIONS = [
    { name: "Backlog",    description: "Awaiting evaluation" },
    { name: "Ready",      description: "This item hasn't been started, only specified, evaluated and prioritized." },
    { name: "In Progress",description: "This is actively being worked on." },
    { name: "In Review",  description: "A task with a pull request awaiting review." },
    { name: "Done",       description: "This has been completed." },
    { name: "Canceled",   description: "Decided to cancel" }
];

// 1. Get project
const projectQuery = `
              query($org: String!, $number: Int!) {
                organization(login: $org) {
                  projectV2(number: $number) {
                    id
                    fields(first: 20) {
                      nodes {
                        ... on ProjectV2SingleSelectField {
                          id
                          name
                          options { id name }
                        }
                      }
                    }
                  }
                }
              }
            `;

const project = await github.graphql(projectQuery, {
    org: ORG,
    number: PROJECT_NUMBER
});

const projectId = project.organization.projectV2.id;

const statusField = project.organization.projectV2.fields.nodes
    .find(f => f.name === "Status");

if (!statusField) {
    throw new Error("❌ No 'Status' field found in project!");
}

// 2. Create missing options
for (const opt of REQUIRED_OPTIONS) {
    const exists = statusField.options.find(o => o.name === opt.name);
    if (exists) {
        console.log(`✔ Status option exists: ${opt.name}`);
        continue;
    }

    console.log(`➕ Creating Status option: ${opt.name}`);

    const createMutation = `
                mutation($field: ID!, $name: String!, $description: String!) {
                  updateProjectV2FieldConfiguration(input: {
                    fieldId: $field,
                    singleSelect: {
                      options: [{
                        name: $name,
                        description: $description
                      }]
                    }
                  }) {
                    projectV2Field {
                      ... on ProjectV2SingleSelectField {
                        id
                      }
                    }
                  }
                }
              `;

    await github.graphql(createMutation, {
        field: statusField.id,
        name: opt.name,
        description: opt.description
    });
}

console.log("🎉 Status options initialized.");
