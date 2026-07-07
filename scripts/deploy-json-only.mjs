#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dataPath = process.argv[2] || "data/devfest-data.json";
const branch = process.env.GH_PAGES_BRANCH || "gh-pages";
const token = process.env.PAT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

if (!token || !repo) {
  console.error("Missing PAT_GITHUB_TOKEN/GITHUB_TOKEN or GITHUB_REPOSITORY");
  process.exit(1);
}

const [owner, repoName] = repo.split("/");
const remoteUrl = `https://x-access-token:${token}@github.com/${owner}/${repoName}.git`;
const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
const sourcePath = path.resolve(repoRoot, dataPath);
const workDir = path.join(repoRoot, ".gh-pages-work");

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

function main() {
  if (fs.existsSync(workDir)) {
    fs.rmSync(workDir, { recursive: true, force: true });
  }

  fs.mkdirSync(workDir, { recursive: true });

  let branchExists = true;
  try {
    run(`git clone --depth 1 --branch ${branch} ${remoteUrl} ${workDir}`, {
      stdio: "pipe",
    });
  } catch {
    branchExists = false;
    run(`git clone --depth 1 ${remoteUrl} ${workDir}`, { stdio: "pipe" });
  }

  if (!branchExists) {
    process.chdir(workDir);
    run(`git checkout --orphan ${branch}`);
    for (const file of fs.readdirSync(".")) {
      if (file !== ".git") {
        fs.rmSync(file, { recursive: true, force: true });
      }
    }
  }

  fs.copyFileSync(sourcePath, path.join(workDir, "devfest-data.json"));

  process.chdir(workDir);
  run("git config user.name github-actions[bot]");
  run("git config user.email github-actions[bot]@users.noreply.github.com");
  run("git add devfest-data.json");

  try {
    run("git diff --staged --quiet");
    console.log("No changes to devfest-data.json on gh-pages");
    return;
  } catch {
    run(`git commit -m "Update devfest-data.json [skip ci]"`);
    run(`git push origin ${branch}`);
    console.log("Pushed updated devfest-data.json to gh-pages");
  }
}

main();
