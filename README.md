<p align="center">
  <img src="assets/logo.png" alt="LogiBrew-logo" width="550"/>
</p>


## Inspiration
The idea for LogiBrew emerged from the turbulent landscape of the logistics industry in 2025, where supply chain disruptions—driven by global events, evolving regulations like EU ETS emission limits, and operational issues such as multimodal shipment delays—call for more than traditional reactive tools. As a team passionate about AI-enhanced collaboration, we were motivated by the real challenges logistics professionals face: fragmented data causing inefficient escalations, the absence of tamper-evident logging for audits (potentially leading to fines for non-compliance with UN hazardous material codes), and lost chances to learn from historical incidents. Leveraging Atlassian's ecosystem, we envisioned a "Verifiable Adaptation Framework" that transforms disruptions into proactive, team-oriented enhancements. LogiBrew fosters resilience by integrating AI insights into tools like Jira and Confluence, enabling teams to adapt routes, validate compliance, and maintain traceable audit trails without relying on external systems. Our drive was to connect volatile supply chains with seamless collaborative software, turning hypothetical scenarios into verifiable, actionable outcomes.

## What it does
LogiBrew is a Forge-powered Atlassian app tailored for logistics teams, specializing in AI-assisted disruption management and verifiable decision-making. It processes user-entered shipment details—such as routes, cargo types, and timelines—to deliver context-aware insights and automations. Powered by Rovo agents, it analyzes inputs to propose adaptations like route optimizations or compliance checks, then synchronizes results across Atlassian products for collaboration. For example, data input via Jira issue forms triggers AI to identify issues (e.g., regulatory discrepancies) and generate hash-secured logs for audits. It supports multimodal shipments with validations against standards like UN codes and simulates scenarios such as delay impacts using rule-based logic (e.g., estimating cost effects via formulas like \( \text{cost} = \text{distance} \times \text{factor} \)). This forms a closed-loop: insights create Jira tasks, document in Confluence knowledge bases, notify via JSM, and track metrics. As a cloud-native solution, it emphasizes secure, manual/API-based inputs, data minimization, and quick-loading UIs for resilience in volatile environments.

## Challenges we ran into
Navigating Forge's UI Kit restrictions proved challenging—no standard HTML/React elements like `<div>`, requiring creative use of `Box`, `Stack`, and `Inline` for layouts while maintaining ARIA accessibility. Implementing verifiable logging demanded precise hash chain logic without external crypto dependencies, using JavaScript's `crypto` module and storing roots in Confluence properties. Security hurdles included scope minimization, `asUser()` for REST calls (e.g., `requestJira`), and no direct internet access beyond allowed fetches. Manifest updates triggered redeploys and upgrades for permissions, necessitating frequent `forge lint` validations. Coordinating multi-product flows (e.g., Jira inputs to Rovo analysis to Confluence syncs) required accurate event triggers, and simulating niche cases like temperature impacts (\( \Delta T > \theta \Rightarrow \text{risk flag} \)) without real APIs relied on robust mocks. Phasing constraints (prioritizing MVP over future features like SQL storage) tested our roadmap, but `forge tunnel` for hot-reloads aided debugging in this constrained setup.

## Accomplishments that we're proud of
We're thrilled with LogiBrew's "Verifiable Adaptation Framework," which seamlessly blends Rovo AI and Atlassian's tools for traceable insights, turning disruptions into growth opportunities with hash-verified logs embedded in workflows. Achieving a closed-loop system—where AI-suggested adaptations auto-generate Jira tasks linked to Confluence docs and JSM notifications—stands out as a deep ecosystem integration. Our MVP's quick deployment, with responsive UIs and scalable data sharding for thousands of entries, demonstrates pragmatic engineering. Proudly, we embedded compliance features like UN code validations and emission calculations without hardware, ensuring audit-ready transparency. Aligning with Atlassian's strengths in collaboration, LogiBrew promotes efficiency and resilience, and we're excited about its potential for Marketplace distribution.

## What we learned
Developing LogiBrew expanded our knowledge of serverless Forge apps, including customizing Rovo agents for workflows and chaining AI insights (e.g., rule-based predictions) across products. The project emphasized balancing idiomatic JavaScript simplicity with robustness for edge cases in cloud environments, plus internationalization and ARIA standards for inclusive UIs.

## What's next for LogiBrew
Next, we will be incorporating workflow automations, team collaboration features and advanced analytics for real-time forecasting. Transitioning from mocks to real APIs (e.g., weather/port status via secure fetches) will enhance accuracy. We plan Marketplace submission for broader reach, user feedback loops to refine AI prompts, and beta features like SQL storage for sharded logs. Long-term, expansions include deeper ML integrations and support for more languages/terms, solidifying LogiBrew as a resilient logistics app.

---

<h3 align="center">
Developed By <br>
<a href="https://github.com/xavio2495">Immanuel</a> X
<a href="https://github.com/charlesms1246">Charles M S</a>
</h3>
