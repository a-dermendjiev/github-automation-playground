const { Minimatch } = require("minimatch");

const prNumber = context.payload.pull_request.number;
const owner = context.repo.owner;
const repo = context.repo.repo;

// Get modified files in the PR
const { data: files } = await github.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
});

const labels = new Set();

// Auto-label rules (based on file paths)
const rules = [
    { label: "frontend", patterns: ["frontend/**", "src/ui/**", "**/*.css", "**/*.scss", "**/*.vue", "**/*.jsx", "**/*.tsx"] },
    { label: "backend", patterns: ["backend/**", "src/server/**", "**/*.go", "**/*.py", "**/*.java", "**/*.rb", "**/*.php"] },
    { label: "devops", patterns: [".github/workflows/**", "infra/**", "docker/**", "**/Dockerfile", "**/*.tf", "**/*.yml"] },
    { label: "ml", patterns: ["ml/**", "notebooks/**", "models/**", "**/*.ipynb"] },
    { label: "security", patterns: ["security/**", "audit/**"] },
    { label: "documentation", patterns: ["docs/**", "**/*.md", "**/*.rst"] }
];

// Match changed files against label rules
for (const file of files) {
    const filePath = file.filename;

    for (const rule of rules) {
        for (const pattern of rule.patterns) {
            const mm = new Minimatch(pattern, { dot: true });
            if (mm.match(filePath)) {
                labels.add(rule.label);
            }
        }
    }
}

const labelArray = [...labels];
core.info(`Labels to add: ${labelArray.join(", ")}`);

// Apply labels to PR
if (labelArray.length > 0) {
    await github.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: labelArray
    });
}
