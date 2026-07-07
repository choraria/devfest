#!/usr/bin/env node

const CF_API = "https://api.cloudflare.com/client/v4";

const LIST_NAME = "devfest_redirects_devfe_st";
const RULE_REF = "devfest_redirects_devfe_st";
const RULESET_NAME = "DevFest Bulk Redirects — devfe.st";
const HOSTS = ["devfe.st", "www.devfe.st"];

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !apiToken) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
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

async function ensureRedirectList() {
  const lists = await cfRequest("GET", `/accounts/${accountId}/rules/lists`);
  const existing = lists.find((l) => l.name === LIST_NAME);

  if (existing) {
    console.log(`Redirect list exists: ${existing.id}`);
    return existing.id;
  }

  const created = await cfRequest("POST", `/accounts/${accountId}/rules/lists`, {
    name: LIST_NAME,
    kind: "redirect",
    description: "DevFest shortlinks — devfe.st only",
  });

  console.log(`Created redirect list: ${created.id}`);
  console.log(`Set CLOUDFLARE_REDIRECT_LIST_ID secret to: ${created.id}`);
  return created.id;
}

function buildRule() {
  const hostFilter = HOSTS.map((h) => `"${h}"`).join(" ");
  return {
    ref: RULE_REF,
    description: "DevFest shortlinks for devfe.st only",
    expression: `(http.host in {${hostFilter}}) and (http.request.full_uri in $${LIST_NAME})`,
    action: "redirect",
    action_parameters: {
      from_list: {
        name: LIST_NAME,
        key: "http.request.full_uri",
      },
    },
  };
}

async function ensureBulkRedirectRule() {
  let ruleset;

  try {
    ruleset = await cfRequest(
      "GET",
      `/accounts/${accountId}/rulesets/phases/http_request_redirect/entrypoint`
    );
  } catch {
    ruleset = null;
  }

  const newRule = buildRule();

  if (!ruleset) {
    const created = await cfRequest("POST", `/accounts/${accountId}/rulesets`, {
      name: RULESET_NAME,
      kind: "root",
      phase: "http_request_redirect",
      rules: [newRule],
    });
    console.log(`Created ruleset: ${created.id}`);
    return;
  }

  const rules = ruleset.rules || [];
  const existingIndex = rules.findIndex((r) => r.ref === RULE_REF);

  if (existingIndex >= 0) {
    rules[existingIndex] = { ...rules[existingIndex], ...newRule };
    console.log("Updating existing DevFest redirect rule");
  } else {
    rules.push(newRule);
    console.log("Appending DevFest redirect rule to existing ruleset");
  }

  await cfRequest(
    "PUT",
    `/accounts/${accountId}/rulesets/${ruleset.id}`,
    { rules }
  );

  console.log(`Updated ruleset: ${ruleset.id}`);
}

async function main() {
  const listId = await ensureRedirectList();
  await ensureBulkRedirectRule();
  console.log("\nBootstrap complete.");
  console.log(`CLOUDFLARE_REDIRECT_LIST_ID=${listId}`);
  console.log("\nRun sync-cloudflare-redirects.mjs to populate redirect entries.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
