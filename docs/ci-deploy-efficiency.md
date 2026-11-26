# V0.23.1 — CI/CD lean workflow

## Findings
Vercel commit statuses for V0.21 (bd296bec), V0.22 (c8a93a9c), and V0.23 (2bb0b08f) failed with a build-rate-limit link. Production was V0.20.1 (66774d91). Preview V0.22 (fdac2e7f) was READY; its build completed in 9 s, and Vite took 5.31 s. This is a platform quota problem, not proof of defective production JavaScript. GitHub Actions and Vercel deploys are distinct. The prior deployment API also reported HTTP 402 and 100/day Hobby quota.

## Policy
- Normal PR: one Validate frontend job (unit tests, pinned-asset stage/build, desktop/mobile smoke, artifacts). Cancel obsolete runs on the same PR. 10-minute upper timeout, not a measured duration.
- Asset research and authoring: five asset auditions only for asset/pipeline changes or selected manual runs; Blender manual only. Full browser validation manual; detailed spatial review and performance benchmark only relevant paths or manual dispatch.
- Vercel git.deploymentEnabled: '**': false, 'main': true, 'preview/**': true. Work on ordinary feature branches, merge validated releases; explicit preview branches or manual preview only when requested. Existing branches with older config may still auto-deploy until updated.
- Keep exact hash verification and no change to billing or deployment protection. No attempts to bypass quotas. After quota recovery, deploy latest main once, not each skipped release. Check the commit SHA and READY state before declaring publication.
- npm install remains because there is no package-lock.json in main; reproducible lockfile and npm ci are follow-ups. No arbitrary job-duration or FPS claim before measurement.

References: [GitHub Actions workflow concurrency and paths](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax); [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration); [Vercel limits](https://vercel.com/docs/limits).
