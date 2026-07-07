#!/usr/bin/env node

import fs from "fs";

const CF_API = "https://api.cloudflare.com/client/v4";
const LIST_NAME = "devfest_redirects_devfe_st";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const listId = process.env.CLOUDFLARE_REDIRECT_LIST_ID;
const host = process.env.DEVFEST_HOST || "devfe.st";
const dataPath = process.argv[2] || "data/devfest-data.json";

if (!accountId || !apiToken || !listId) {
  console.error(
    "Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, or CLOUDFLARE_REDIRECT_LIST_ID"
  );
  process.exit(1);
}

async function cfRequest(method, path, body) {
  const response = await fetch(`${CF_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(
      `Cloudflare API ${method} ${path} failed: ${JSON.stringify(json.errors || json)}`
    );
  }
  return json.result;
}

function loadAndValidateEntries() {
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  if (!Array.isArray(data)) {
    throw new Error("devfest-data.json must be an array");
  }

  if (data.length > 10000) {
    throw new Error(`Too many entries: ${data.length} (max 10,000)`);
  }

  const slugs = new Set();
  const items = [];

  for (const entry of data) {
    if (!entry.slug) {
      throw new Error("Entry missing slug");
    }
    if (!/^[a-z0-9-]+$/.test(entry.slug)) {
      throw new Error(`Invalid slug format: ${entry.slug}`);
    }
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate slug: ${entry.slug}`);
    }
    if (!entry.destinationUrl?.startsWith("https://")) {
      throw new Error(`Invalid destinationUrl for slug: ${entry.slug}`);
    }

    slugs.add(entry.slug);
    items.push({
      redirect: {
        source_url: `${host}/${entry.slug}`,
        target_url: entry.destinationUrl,
        status_code: 301,
        subpath_matching: false,
        preserve_query_string: false,
      },
      comment: entry.devfestName || entry.slug,
    });
  }

  return items;
}

async function waitForOperation(operationId) {
  const maxAttempts = 60;
  for (let i = 1; i <= maxAttempts; i++) {
    const result = await cfRequest(
      "GET",
      `/accounts/${accountId}/rules/lists/bulk_operations/${operationId}`
    );

    console.log(`Bulk operation status: ${result.status} (attempt ${i})`);

    if (result.status === "completed") return;
    if (result.status === "failed") {
      throw new Error(`Bulk operation failed: ${JSON.stringify(result)}`);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error("Bulk operation timed out");
}

async function main() {
  const items = loadAndValidateEntries();
  console.log(`Syncing ${items.length} redirects for host ${host}...`);

  const result = await cfRequest(
    "PUT",
    `/accounts/${accountId}/rules/lists/${listId}/items`,
    items
  );

  if (result.operation_id) {
    await waitForOperation(result.operation_id);
  }

  const list = await cfRequest(
    "GET",
    `/accounts/${accountId}/rules/lists/${listId}`
  );

  console.log(`Sync complete. List "${LIST_NAME}" has ${list.num_items} items.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
