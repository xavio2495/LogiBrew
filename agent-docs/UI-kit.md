### Required Forge UI Kit Components for LogiBrew

Based on the detailed features, technical aspects, and implementation status of LogiBrew from the provided documents (e.g., data entry forms in Jira issues, dashboards for metrics/trends, alerts/notifications, verifiable log displays, scenario simulations, compliance validations, and integrations across Jira, Confluence, JSM, and Rovo), I've identified all necessary UI Kit components from `@forge/react`. These are the only supported components for Forge UI Kit apps—standard React or HTML elements are forbidden.

I've included every component that aligns with LogiBrew's needs without exceptions, mapping them to specific use cases (e.g., forms for shipment inputs, charts for analytics, modals for simulations). If a component is potentially useful but not explicitly required (e.g., for niche customizations like user profiles), I've tagged it as "suggested". Components are categorized by type for clarity, with tags:

- **core**: Essential for primary AI-driven interfaces (e.g., Rovo agent interactions, insights display).
- **essential**: Required for workflows like data entry, automations, and syncing.
- **ui-form**: For input forms and validations.
- **ui-display**: For rendering text, lists, and visual elements.
- **ui-chart**: For analytics dashboards and metrics.
- **ui-feedback**: For alerts, errors, and progress indicators.
- **ui-navigation**: For tabs, modals, and structured layouts.
- **suggested**: Useful for enhancements but not strictly mandatory (e.g., if doubtful for edge cases like multilingual tooltips).
- **future-scope**: For potential expansions (e.g., advanced charts if metrics evolve).

LogiBrew's UI emphasizes quick-loading forms (<2s), responsive designs, ARIA accessibility, and localization. All components support these via props (e.g., `aria-label`, `locale`). Use them in modules like `jira:issuePanel` (Phase 1 priority), `jira:dashboardGadget`, `confluence:macro`, etc. Components are declarative; combine them in resolvers or frontend code (e.g., via `@forge/bridge` for API calls).

| Category | Component | Description/Purpose in LogiBrew | Tags |
|----------|-----------|---------------------------------|------|
| **Layout & Structure** | Box | Flexible container for grouping elements (e.g., in forms for shipment details or panels for insights). Supports padding, borders, and alignment for responsive layouts in issue panels or macros. | essential, ui-display |
| **Layout & Structure** | Inline | Arranges elements horizontally (e.g., inline fields like cargo type and weight in forms, or status badges next to alerts). | essential, ui-display |
| **Layout & Structure** | Stack | Stacks elements vertically (e.g., form sections for routes/timelines, or stacked insights in dashboards). | essential, ui-display |
| **Layout & Structure** | Frame | Frames content with borders (e.g., for verifiable log displays or simulation outputs in modals). | ui-display, suggested |
| **Text & Formatting** | Text | Basic text rendering (e.g., displaying AI suggestions, compliance explanations, or log timestamps). Supports color, size, and weight props. | core, essential, ui-display |
| **Text & Formatting** | Heading | Headings for sections (e.g., "Shipment Details" in forms, "AI Insights" in panels, or "Trend Forecast" in dashboards). Levels 1-6 for hierarchy. | essential, ui-display |
| **Text & Formatting** | Em | Emphasizes text (e.g., highlighting flagged mismatches in compliance validations). | ui-display, suggested |
| **Text & Formatting** | Strike | Strikes through text (e.g., showing outdated routes in adaptation suggestions). | suggested |
| **Text & Formatting** | Strong | Bold text (e.g., key metrics like "Delay Impact: High" in alerts). | ui-display, suggested |
| **Text & Formatting** | Code | Inline code snippets (e.g., displaying UN codes or hash values in logs). | ui-display, suggested |
| **Text & Formatting** | CodeBlock | Multi-line code blocks (e.g., for debugging logs or rule-based calculations in admin views). | suggested |
| **Form Elements** | Form | Wraps form elements (e.g., main container for shipment data entry in Jira issue panels, with submit handlers for triggering Rovo analysis). | essential, ui-form |
| **Form Elements** | FormHeader | Header for forms (e.g., title and description for "Enter Shipment Data"). | essential, ui-form |
| **Form Elements** | FormSection | Groups form fields (e.g., sections for "Route Info" and "Cargo Details"). | essential, ui-form |
| **Form Elements** | FormFooter | Footer for forms (e.g., submit buttons and helper text). | essential, ui-form |
| **Form Elements** | Label | Labels for inputs (e.g., "Origin", "Destination", "UN Code"). Supports required asterisk. | essential, ui-form |
| **Form Elements** | RequiredAsterisk | Marks required fields (e.g., in shipment forms for mandatory timelines). | essential, ui-form |
| **Form Elements** | Textfield | Text inputs (e.g., for routes, cargo descriptions, port codes). Supports validation and placeholders. | essential, ui-form |
| **Form Elements** | TextArea | Multi-line text (e.g., for detailed disruption notes or reverse logistics details). | essential, ui-form |
| **Form Elements** | Select | Dropdown selections (e.g., cargo types, transport modes, UN code selectors). Supports search and multi-select. | essential, ui-form |
| **Form Elements** | Checkbox | Checkboxes (e.g., for multimodal support options or compliance acknowledgments). | ui-form, suggested |
| **Form Elements** | RadioGroup | Groups radio buttons (e.g., for selecting shipment priority: low/medium/high). | ui-form, suggested |
| **Form Elements** | Radio | Individual radio buttons within groups. | ui-form, suggested |
| **Form Elements** | Toggle | On/off switches (e.g., enable/disable auto-syncing or real API use in settings). | suggested |
| **Form Elements** | Range | Sliders (e.g., for temperature ranges in perishable goods modeling). | ui-form, suggested |
| **Form Elements** | DatePicker | Date selection (e.g., shipment timelines or delay simulation dates). | essential, ui-form |
| **Form Elements** | TimePicker | Time selection (e.g., estimated arrival times). | ui-form, suggested |
| **Form Elements** | Calendar | Full calendar view (e.g., for scheduling assistance in team optimization). | suggested |
| **Form Elements** | InlineEdit | Editable inline fields (e.g., quick edits to resource allocations in dashboards). | suggested |
| **Form Elements** | UserPicker | Select users (e.g., assign team members in resource allocation). | suggested |
| **Form Elements** | User | Displays user info (e.g., in logs for "Decision by: User"). | suggested |
| **Form Elements** | UserGroup | Displays user groups (e.g., for team notifications). | suggested |
| **Buttons & Actions** | Button | Standard buttons (e.g., "Submit Shipment", "Generate Insights", "Verify Log"). | essential |
| **Buttons & Actions** | LinkButton | Buttons as links (e.g., "View Confluence Doc" for linked knowledge bases). | suggested |
| **Buttons & Actions** | LoadingButton | Buttons with loading state (e.g., during Rovo AI processing or API fetches). | essential, ui-feedback |
| **Buttons & Actions** | ButtonGroup | Groups buttons (e.g., "Approve/Reject" in workflow validations). | suggested |
| **Feedback & Messages** | SectionMessage | Displays info/warning/error sections (e.g., alerts for threshold breaches like emission limits). | essential, ui-feedback |
| **Feedback & Messages** | SectionMessageAction | Actions within messages (e.g., "Resolve" button in alerts). | ui-feedback, suggested |
| **Feedback & Messages** | ErrorMessage | Error displays (e.g., validation failures like "Invalid UN Code"). | essential, ui-feedback |
| **Feedback & Messages** | ValidMessage | Success messages (e.g., "Compliance Validated"). | ui-feedback, suggested |
| **Feedback & Messages** | HelperMessage | Helper text under fields (e.g., "Enter UN code format: UNXXXX"). | ui-form, suggested |
| **Feedback & Messages** | EmptyState | For no-data states (e.g., "No Disruptions Found" in dashboards). | ui-feedback, suggested |
| **Feedback & Messages** | Spinner | Loading indicators (e.g., during data fusion or syncing). | essential, ui-feedback |
| **Feedback & Messages** | ProgressBar | Progress tracking (e.g., upload progress for custom rules or simulation loading). | ui-feedback, suggested |
| **Feedback & Messages** | ProgressTracker | Multi-step trackers (e.g., workflow steps in guided procedures). | suggested |
| **Charts & Visuals** | LineChart | Line charts (e.g., trend forecasting for delay patterns over time). | essential, ui-chart |
| **Charts & Visuals** | BarChart | Bar charts (e.g., metric tracking for response times by category). | essential, ui-chart |
| **Charts & Visuals** | PieChart | Pie charts (e.g., breakdown of disruption causes). | ui-chart, suggested |
| **Charts & Visuals** | StackBarChart | Stacked bars (e.g., resource allocation distributions). | ui-chart, suggested |
| **Charts & Visuals** | HorizontalBarChart | Horizontal bars (e.g., emission calculations per shipment leg). | ui-chart, suggested |
| **Charts & Visuals** | HorizontalStackBarChart | Horizontal stacked (e.g., multimodal shipment breakdowns). | suggested, ui-chart |
| **Charts & Visuals** | SingleValueChart | Single-value displays (e.g., total cost impact from simulations). | suggested, ui-chart |
| **Lists & Tables** | List | Unordered/ordered lists (e.g., step-by-step adaptation suggestions). | essential, ui-display |
| **Lists & Tables** | ListItem | Items within lists (e.g., individual guidance steps). | essential, ui-display |
| **Lists & Tables** | DynamicTable | Tables for data (e.g., verifiable log trails with timestamps/hashes, or trend data). Supports sorting/pagination. | essential, ui-display |
| **Navigation & Modals** | Modal | Dialogs (e.g., for scenario simulations or confirmation of automations). | essential, ui-navigation |
| **Navigation & Modals** | ModalHeader | Modal headers (e.g., title for "Run Delay Simulation"). | essential, ui-navigation |
| **Navigation & Modals** | ModalTitle | Titles in modals. | essential, ui-navigation |
| **Navigation & Modals** | ModalBody | Modal content body. | essential, ui-navigation |
| **Navigation & Modals** | ModalFooter | Modal footers (e.g., action buttons). | essential, ui-navigation |
| **Navigation & Modals** | ModalTransition | Animates modal open/close for smooth UX. | ui-navigation, suggested |
| **Navigation & Modals** | Tabs | Tabbed interfaces (e.g., switch between "Insights" and "Logs" in panels). | ui-navigation, suggested |
| **Navigation & Modals** | TabList | Lists tabs. | suggested, ui-navigation |
| **Navigation & Modals** | TabPanel | Tab content panels. | suggested, ui-navigation |
| **Navigation & Modals** | Tab | Individual tabs. | suggested, ui-navigation |
| **Navigation & Modals** | Popup | Popups (e.g., for quick tooltips on metrics). | suggested, ui-navigation |
| **Icons & Tags** | Icon | Icons (e.g., warning icons in alerts, checkmarks for validations). | essential, ui-display |
| **Icons & Tags** | Badge | Badges (e.g., status like "High Risk" in insights). | essential, ui-display |
| **Icons & Tags** | Lozenge | Lozenges (e.g., compliance status: "Valid/Invalid"). | essential, ui-display |
| **Icons & Tags** | Tag | Tags (e.g., for cargo types like "Hazardous"). | suggested |
| **Icons & Tags** | TagGroup | Groups tags (e.g., multiple modes in multimodal shipments). | suggested |
| **Other** | Tooltip | Hover tooltips (e.g., explanations for fields like "EU ETS Limits"). | suggested |
| **Other** | Link | Hyperlinks (e.g., to external docs or linked Jira tasks). | suggested |
| **Other** | Image | Displays images (e.g., icons or diagrams in macros, if needed for visualizations). | suggested |
| **Other** | AdfRenderer | Renders Atlassian Document Format (e.g., for rich Confluence content in macros/logs). | suggested, future-scope |