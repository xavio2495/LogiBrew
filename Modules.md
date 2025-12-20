### Required Forge Modules for LogiBrew

Note: Modules are tagged based on their role in LogiBrew:

- **core**: Fundamental to the app's AI and verifiable adaptation framework.
- **essential**: Required for primary workflows like data handling, automations, and syncing.
- **ui**: For user interfaces like forms, panels, and dashboards.
- **backend**: For event-driven logic, scheduling, and processing (e.g., hash checks, validations).
- **external-connector**: For integrations with external APIs (e.g., weather/port status).
- **suggested**: Potentially useful but not strictly required (e.g., if doubtful for niche use like personal settings).
- **future-scope**: Preview/beta modules that could enhance scalability or features in future iterations (these modules need not be integrated right now)

I've prioritized modules that directly support LogiBrew's multi-product chaining (e.g., input in Jira → AI in Rovo → tasks/docs/notifs). Note: Some modules have variants (e.g., UI Kit for simple declarative UIs, Custom UI for React-based flexibility)—use both where needed for responsive forms/dashboards. Resources (for Custom UI static files) and permissions (e.g., outbound-requests for fetch API) are not modules but should be added to the manifest as needed. Storage and entity properties use APIs, not dedicated modules.

| Product/Category | Module Key | Description/Purpose in LogiBrew | Tags |
|------------------|------------|---------------------------------|------|
| **Rovo** | rovo:agent | Creates a customizable AI agent in Rovo Chat for handling user queries, analyzing inputs (e.g., shipment details), generating insights/suggestions/validations, and chaining actions (e.g., to Jira tasks or Confluence docs). Core for AI Insights, Compliance Validation, Scenario Simulations, and the Verifiable Adaptation Framework. | core, essential |
| **Rovo** | action | Defines tasks the agent can perform, such as API calls, code execution for hash-based logging, or automating workflows (e.g., creating verifiable logs, alerting on thresholds). Invoked by the agent for outcomes like task creation or notifications. | core, essential, backend |
| **Jira** | jira:issuePanel | Adds custom panels to Jira issue pages for data entry forms (e.g., routes, cargo types) and displaying insights/alerts. Variants: UI Kit (simple components), Custom UI (advanced React forms). | essential, ui |
| **Jira** | jira:customField | Adds custom fields to Jira issues for specialized data input (e.g., shipment timelines, UN codes). Supports rule-based validations. | essential, ui |
| **Jira** | jira:workflowValidator | Defines validations for workflow transitions (e.g., compliance checks against regulatory thresholds before approving shipments). | essential, backend |
| **Jira** | jira:workflowCondition | Sets conditions for workflows (e.g., ensuring verifiable logs exist before transitions). | essential, backend |
| **Jira** | jira:workflowPostFunction | Automates actions on workflow transitions (e.g., generating hash-verified logs, syncing to Confluence, or triggering Rovo analysis). | essential, backend |
| **Jira** | jira:dashboardGadget | Builds widgets for Jira dashboards to display metrics/trends (e.g., delay patterns, response times). Variants: UI Kit/Custom UI. | essential, ui |
| **Jira** | jira:issueContext | Adds collapsible panels on issue views for additional context (e.g., AI-generated adaptation suggestions). Replaces older issueGlance. | essential, ui |
| **Jira** | jira:issueAction | Adds action buttons to issues for quick operations (e.g., "Run AI Simulation" or "Generate Log"). | ui, suggested |
| **Jira** | jira:issueActivity | Displays custom activities in the issue stream (e.g., logging AI insights or compliance flags). | backend, suggested |
| **Jira** | jira:customFieldType | Defines new custom field types with behaviors (e.g., multimodal shipment validators). | suggested |
| **Jira** | jira:globalPage | Adds global pages in Jira's menu for app-wide features (e.g., overview dashboard for logistics trends). | ui, suggested |
| **Jira** | jira:projectPage | Adds pages in project context for team-specific views (e.g., resource allocation suggestions). | ui, suggested |
| **Jira** | jira:projectSettingsPage | Builds project admin settings pages (e.g., for configuring rule-based alerts or retention periods). | suggested |
| **Jira** | jira:adminPage | Creates admin pages for global configs (e.g., simulating inputs for testing). | suggested |
| **Jira** | jira:personalSettingsPage | Adds personal settings pages for user customizations (e.g., preferred views). | suggested |
| **Jira** | jira:globalPermission | Defines global permissions for roles (e.g., access to verifiable logs). | suggested |
| **Jira** | jira:commandPalette | Adds items to Jira's command palette for quick app actions (e.g., "Flag Disruption"). | suggested |
| **Jira** | jira:actionValidator | (Preview) Custom action validations (e.g., for AI-triggered actions). | future-scope |
| **Jira** | jira:backlogAction | (Preview) Actions in backlog view (e.g., prioritizing disruptions). | future-scope |
| **Jira** | jira:boardAction | (Preview) Actions on boards (e.g., real-time allocations). | future-scope |
| **Confluence** | confluence:macro | Creates reusable macros for embedding dynamic content (e.g., verifiable logs or AI insights in docs). Supports custom configurations. | essential, ui |
| **Confluence** | confluence:contentProperty | Defines indexed properties on Confluence content for CQL-searchable data (e.g., timestamped logs, trend data). | essential, backend |
| **Confluence** | confluence:globalPage | Adds global pages for knowledge bases (e.g., aggregated disruption learnings). | essential, ui |
| **Confluence** | confluence:spacePage | Adds space-specific pages for team docs (e.g., perishable goods handling guides). | ui, suggested |
| **Confluence** | confluence:globalSettings | Adds global settings tabs (e.g., for app-wide localization or retention configs). | suggested |
| **Confluence** | confluence:spaceSettings | Extends space settings (e.g., for integrating logistics rules). | suggested |
| **Confluence** | confluence:homepageFeed | Adds feeds to Confluence homepage (e.g., recent alerts or trends). | suggested |
| **Confluence** | confluence:contentAction | Adds actions on content (e.g., "Analyze Doc with Rovo"). | suggested |
| **Confluence** | confluence:contentBylineItem | Adds items to page bylines (e.g., compliance status links). | suggested |
| **Confluence** | confluence:contextMenu | Extends context menus (e.g., right-click to verify log). | suggested |
| **Confluence** | confluence:customContent | Registers new content types (e.g., "Disruption Report"). | suggested |
| **Confluence** | confluence:pageBanner | Adds banners to pages (e.g., for active alerts). | suggested |
| **Confluence** | confluence:backgroundScript | Runs background functions on pages (e.g., auto-syncing data). | backend, suggested |
| **Confluence** | confluence:fullPage | (Preview) Full-page experiences (e.g., advanced dashboards). | future-scope |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalRequestDetailPanel | Adds panels to request details for insights (e.g., delay impacts). Variants: UI Kit/Custom UI. | essential, ui |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalRequestViewAction | Adds actions to request views (e.g., "Approve with AI Suggestion"). | essential, ui |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalHeader | Customizes portal headers (e.g., for branded alerts). | ui, suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalFooter | Customizes footers (e.g., quick links to logs). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalSubheader | Adds subheaders (e.g., for real-time status). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:organizationPanel | Adds panels to organization pages (e.g., compliance overviews). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalProfilePanel | Adds to profile pages (e.g., user-specific prefs). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalRequestCreatePropertyPanel | Adds property panels during request creation (e.g., input validation). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:portalRequestDetail | Extends request details (e.g., with AI flags). | suggested |
| **Jira Service Management (JSM)** | jiraServiceManagement:queuePage | Customizes queue pages for agents (e.g., prioritized disruptions). | suggested |
| **General Forge** | function | Defines backend logic (e.g., processing inputs, hash chains, rule-based calculations). Referenced by other modules like triggers/actions. | core, essential, backend |
| **General Forge** | trigger | Invokes functions on Atlassian events (e.g., issue created/updated for real-time analysis). | essential, backend |
| **General Forge** | scheduledTrigger | Runs functions periodically (e.g., trend forecasting, metric aggregation). | essential, backend |
| **General Forge** | webtrigger | Invokes functions via HTTP (e.g., for external webhooks or API integrations). | external-connector, suggested |
| **General Forge** | consumer | Handles async event queues (e.g., for reliable syncing across products). | backend, suggested |
| **General Forge** | sql | (Preview) Enables SQL storage for persistent data (e.g., sharded shipment logs). | future-scope |
| **General Forge** | llm | (Mentioned in docs) For direct LLM interactions if not via Rovo (e.g., custom prompts). | suggested, future-scope |