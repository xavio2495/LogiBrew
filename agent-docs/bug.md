The next task for us, is to fix the bug which occurs during calls. Here is the first issue which we got.

Always follow the rules given in logibrew-x1\AGENTS.md

Use forge-knowledge and forge mcp server to gain context and information to solve it

We need to make sure that the error does not persist or is repeated in other features which has been developed.

CLI server output during error when defining field values
```bash
Listening for requests on local port 51485...

>
invocation: 69487b5beeab94fb6621e649192cc734 i
ERROR   04:27:30.898  786090e1-b364-41b2-8c86-'
Require stack:
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Roaming\npm\node_modu\sandbox-runner.js
    at Function._resolveFilename (node:interna
    at defaultResolveImpl (node:internal/modul
    at resolveForCJSWithHooks (node:internal/m
    at Function._load (node:internal/modules/c
    at TracingChannel.traceSync (node:diagnost
    at wrapModuleLoad (node:internal/modules/c
    at Module.require (node:internal/modules/c
    at require (node:internal/modules/helpers:
    at <anonymous> (webpack://logibrew-x1/src/
    at Object.<anonymous> (webpack://logibrew-
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f
    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f
    'C:\\Users\\xavio\\AppData\\Roaming\\npm\\el\\out\\sandbox\\sandbox-runner.js'
  ]
}
Sending error to rovo for analysis...

invocation: 69487b5beeab94fb6621e649192cc734 i
ERROR   04:27:37.134  62fc5e7e-28f2-4b8b-9a30-'
Require stack:
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Local\Temp\forge-dist
- C:\Users\xavio\AppData\Roaming\npm\node_modu\sandbox-runner.js
    at Function._resolveFilename (node:interna
    at defaultResolveImpl (node:internal/modul
    at resolveForCJSWithHooks (node:internal/m
    at Function._load (node:internal/modules/c
    at TracingChannel.traceSync (node:diagnost
    at wrapModuleLoad (node:internal/modules/c
    at Module.require (node:internal/modules/c
    at require (node:internal/modules/helpers:
    at <anonymous> (webpack://logibrew-x1/src/
    at Object.<anonymous> (webpack://logibrew-
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f
    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f    'C:\\Users\\xavio\\AppData\\Local\\Temp\\f
    'C:\\Users\\xavio\\AppData\\Roaming\\npm\\el\\out\\sandbox\\sandbox-runner.js'
  ]
}
```
Output in the client UI as text when the error occured

```bash
An error occurred when formatting the value. Evaluation failed: "issue.fields" - Unrecognized property of `issue`: "fields" ('fields'). Available properties of type 'Issue' are: '53aa443d-a39c-4b15-a39d-b4c03fd0f666__DEVELOPMENT__shipment-timeline-field', '53aa443d-a39c-4b15-a39d-b4c03fd0f666__DEVELOPMENT__transport-modes-field', '53aa443d-a39c-4b15-a39d-b4c03fd0f666__DEVELOPMENT__un-code-field', 'assignee', 'attachments', 'changelogs', 'childIssues', 'closedSprints', 'color', 'com.atlassian.atlas.jira__project-key', 'com.atlassian.atlas.jira__project-status', 'comments', 'components', 'created', 'creator', 'customfield_10000', 'customfield_10001', 'customfield_10002', 'customfield_10003', 'customfield_10004', 'customfield_10005', 'customfield_10006', 'customfield_10007', 'customfield_10008', 'customfield_10009', 'customfield_10010', 'customfield_10014', 'customfield_10015', 'customfield_10016', 'customfield_10017', 'customfield_10018', 'customfield_10019', 'customfield_10020', 'customfield_10021', 'customfield_10022', 'customfield_10023', 'customfield_10024', 'customfield_10025', 'customfield_10026', 'customfield_10027', 'customfield_10028', 'customfield_10029', 'customfield_10030', 'customfield_10031', 'customfield_10032', 'customfield_10033', 'customfield_10034', 'customfield_10035', 'customfield_10036', 'customfield_10037', 'customfield_10038', 'customfield_10039', 'customfield_10040', 'customfield_10041', 'customfield_10074', 'customfield_10075', 'customfield_10076', 'customfield_10078', 'customfield_10079', 'customfield_10080', 'customfield_10081', 'customfield_10082', 'customfield_10083', 'customfield_10084', 'customfield_10085', 'customfield_10086', 'customfield_10087', 'customfield_10088', 'customfield_10089', 'customfield_10090', 'customfield_10091', 'customfield_10092', 'customfield_10093', 'customfield_10094', 'customfield_10095', 'customfield_10096', 'customfield_10097', 'customfield_10098', 'customfield_10099', 'customfield_10100', 'customfield_10101', 'description', 'done', 'dueDate', 'environment', 'epic', 'fixVersions', 'flagged', 'getNewestChangelog', 'id', 'isEpic', 'issueType', 'key', 'labels', 'links', 'name', 'originalEstimate', 'parent', 'priority', 'project', 'properties', 'remainingEstimate', 'reporter', 'resolution', 'resolutionDate', 'securityLevel', 'sprint', 'status', 'stories', 'subtasks', 'summary', 'timeSpent', 'updated', 'versions', 'voters', 'votes', 'watchers', 'watches', 'worklogs'
```