function auditShape(report) {
  if (
    !report ||
    typeof report !== "object" ||
    report.error ||
    !report.vulnerabilities ||
    Array.isArray(report.vulnerabilities) ||
    !report.metadata?.vulnerabilities
  )
    throw new Error("Dependency audit did not return a complete report.");
  const count = Object.keys(report.vulnerabilities).length;
  if (report.metadata.vulnerabilities.total !== count)
    throw new Error("Dependency audit vulnerability totals are inconsistent.");
  for (const item of Object.values(report.vulnerabilities)) {
    if (!item || !Array.isArray(item.via) || !item.via.length)
      throw new Error("Dependency audit is missing advisory details.");
  }
  return report.vulnerabilities;
}
export function evaluateDependencyAudits(
  runtime,
  full,
  policy,
  today = new Date(),
) {
  const production = auditShape(runtime),
    development = auditShape(full);
  if (Object.keys(production).length)
    throw new Error("Production dependency vulnerabilities are not allowed.");
  const entries = Object.entries(development);
  if (!entries.length)
    return {
      productionVulnerabilities: 0,
      fullVulnerabilities: 0,
      knownDevelopmentRisk: null,
    };
  const known = policy.knownDevelopmentRisk;
  if (
    !known ||
    !Array.isArray(known.packages) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(known.reviewBy)
  )
    throw new Error("The known development risk policy is invalid.");
  if (
    Number.isNaN(today.getTime()) ||
    today.toISOString().slice(0, 10) > known.reviewBy
  )
    throw new Error("The known development advisory requires a fresh review.");
  const allowed = new Set(known.packages);
  function trace(name, visited = new Set()) {
    const item = development[name];
    if (
      !allowed.has(name) ||
      !item ||
      item.severity !== known.severity ||
      visited.has(name)
    )
      throw new Error(`Unreviewed dependency vulnerability: ${name}`);
    const next = new Set(visited).add(name);
    for (const via of item.via) {
      if (typeof via === "string") trace(via, next);
      else if (
        !via ||
        via.url !== known.advisory ||
        via.severity !== known.severity ||
        via.name !== "braces"
      )
        throw new Error(`Unreviewed dependency advisory: ${name}`);
    }
  }
  for (const [name] of entries) trace(name);
  return {
    productionVulnerabilities: 0,
    fullVulnerabilities: entries.length,
    knownDevelopmentRisk: {
      advisory: known.advisory,
      severity: known.severity,
      packages: entries.map(([name]) => name),
      reviewBy: known.reviewBy,
    },
  };
}
