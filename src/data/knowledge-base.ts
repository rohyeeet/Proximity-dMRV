export type KnowledgeScope = "flow" | "form" | "general";

export interface KnowledgeTopic {
  id: string;
  scope: KnowledgeScope;
  title: string;
  /** One line — shown in inline hover hints. */
  summary: string;
  /** Ordered how-to steps, when the topic is task-shaped. */
  steps?: string[];
  /** Explanatory paragraphs, when the topic is concept-shaped. */
  body?: string[];
  relatedTopicIds?: string[];
}

export const knowledgeBase: KnowledgeTopic[] = [
  // ---------- General ----------
  {
    id: "gs-entities",
    scope: "general",
    title: "Entities, fields, and records",
    summary: "A form is an entity; its fields are columns; each submission is a record.",
    body: [
      "Every form you build is an \"entity\" — think of it like a database table. Each field on the form is a column on that table, and every time someone fills out the form, that's one row (a \"record\" or \"submission\").",
      "This matters because lookups and links don't point at vague labels — they point at real entities and real columns, the same way a foreign key points at another table's column.",
    ],
    relatedTopicIds: ["gs-pickers", "form-lookup-select", "form-linked-record"],
  },
  {
    id: "gs-pickers",
    scope: "general",
    title: "Picking entities, fields, and values",
    summary: "Search boxes with a dropdown let you pick a real form, a real field, or a filter value.",
    steps: [
      "Click the picker — it opens a searchable list below it.",
      "Type to filter by name or code, or scroll the grouped list.",
      "Click a row to select it (or check multiple, for multi-pickers).",
      "Click the × on a chip, or the picker's own × icon, to clear a selection.",
    ],
    body: [
      "These pickers are used everywhere you'd otherwise have to type a hardcoded id: linking a flow node to a form, linking a lookup field to a source entity, choosing which field a validation rule checks, and now — narrowing a link down to a specific value on a specific column.",
    ],
    relatedTopicIds: ["gs-entities"],
  },
  {
    id: "gs-publish",
    scope: "general",
    title: "Drafts, versions, and publishing",
    summary: "Edits are saved automatically; Publish stamps a new version number.",
    body: [
      "Every change you make — dragging a node, editing a field, adding a rule — is saved immediately as you go, and survives closing the tab.",
      "Publishing doesn't discard anything; it just bumps the version number and marks the current state as the one live submitters/runs will see. You can keep editing after publishing — the button will offer to publish the next version once you've made a new change.",
    ],
  },

  // ---------- Flow ----------
  {
    id: "flow-overview",
    scope: "flow",
    title: "What is a flow?",
    summary: "A flow is the sequence of steps, gates, and branches a project moves through.",
    body: [
      "A flow describes the lifecycle of one project or reporting cycle: which forms get filled out, in what order, who reviews what, where it can branch, and when it's \"closeable.\"",
      "Flows are built from modules (nodes) connected by lines (edges). This is the same modeling grammar used by BPMN process diagrams — sequence, parallel branches, conditional branches, and loops — kept intentionally simple here.",
      "Each domain pack has one flow, and its backbone is generated from your Stages — see \"Syncing a flow from stages.\" You still add review gates, branches, and milestones by hand on top of that skeleton.",
    ],
    relatedTopicIds: ["stages-overview", "flow-sync", "flow-node-types", "flow-connectors"],
  },
  {
    id: "flow-sync",
    scope: "flow",
    title: "Syncing a flow from stages",
    summary: "\"Sync from stages\" turns your Stage → Form setup into connected steps automatically.",
    steps: [
      "Build out your stages and the forms inside them on the Forms & Stages page first.",
      "Open this domain pack's flow and click \"Sync from stages.\"",
      "A step is added for every form that doesn't have one yet, connected in stage order; steps for forms removed from a stage are taken out (their old connections are left for you to review, since something else may still point at them).",
      "The results panel lists exactly what changed.",
    ],
    body: [
      "Sync never touches anything you've customized: the moment you edit a connection — change its kind, add a condition, drag it to a different node — it stops being auto-managed, so your branches, review gates, and correction loops survive being synced again and again.",
      "Sync doesn't guess at branches. If two stages are really alternatives (e.g. two different packaging routes), sync still lays them out one after another — drop a Branch module and reconnect the auto-drawn edges into conditional ones to express the fork.",
    ],
    relatedTopicIds: ["stages-overview", "flow-node-types", "flow-conditions"],
  },
  {
    id: "flow-node-types",
    scope: "flow",
    title: "Module (node) types",
    summary: "Nine module types cover form steps, gates, branches, automation, and milestones.",
    body: [
      "Form step — a submitter fills out a linked form.",
      "Branch — splits the flow into two or more conditional paths.",
      "Review gate — a reviewer approves or returns the previous step.",
      "Correction loop — the re-entry point a returned submission goes back to.",
      "Automation — runs on its own, usually fed by a connector (a device or external system) rather than a person.",
      "Parallel group — marks concurrent steps that don't depend on each other.",
      "Wait — pauses until a condition or timer is met.",
      "Document — an auto-generated report or certificate, often the last computed step before a milestone.",
      "Milestone — marks the point the cycle becomes \"closeable.\" Milestones should be terminal (no outgoing edges).",
    ],
    relatedTopicIds: ["flow-palette"],
  },
  {
    id: "flow-palette",
    scope: "flow",
    title: "Building with the module palette",
    summary: "Click a module to add it — it auto-stacks onto whatever node you had selected.",
    steps: [
      "Click any node once to select it.",
      "Click a module in the left palette — a new node of that type appears, automatically connected from the node you had selected.",
      "The canvas re-arranges itself into tidy columns after every add, so you never have to manually lay things out.",
      "Click empty canvas to deselect, then click a module to drop an unconnected node instead (useful for starting a second branch).",
    ],
    relatedTopicIds: ["flow-connectors", "flow-auto-arrange"],
  },
  {
    id: "flow-connectors",
    scope: "flow",
    title: "Connecting, rewiring, and deleting",
    summary: "Drag from the small dot on a node's right edge to another node's left edge to connect them.",
    steps: [
      "Hover a node — small circular handles appear on its left (in) and right (out) edges.",
      "Drag from the right handle of one node to the left handle of another to create a connection.",
      "To rewire an existing connection, drag its endpoint to a different node.",
      "Click a node or edge and press Backspace/Delete, or use the inspector's delete button, to remove it.",
    ],
    relatedTopicIds: ["flow-edge-kinds"],
  },
  {
    id: "flow-edge-kinds",
    scope: "flow",
    title: "Edge kinds",
    summary: "Sequential, parallel, conditional, or correction — pick the kind in the edge inspector.",
    body: [
      "Sequential — the default: do this, then that.",
      "Parallel — both branches proceed at once (used for fan-out after a shared step).",
      "Conditional — only taken when its rule matches; give it a condition label and, ideally, a structured rule.",
      "Correction — the loop-back edge from a review gate to a correction point. Any cycle in the graph that isn't marked as \"correction\" is flagged by Validate graph as an error.",
    ],
    relatedTopicIds: ["flow-conditions", "flow-validate"],
  },
  {
    id: "flow-conditions",
    scope: "flow",
    title: "Rule-based (BRE) branch conditions",
    summary: "Conditional edges can check a real field on the upstream form, not just a label.",
    steps: [
      "Select a conditional edge — the inspector shows a \"Rule (BRE)\" section.",
      "It automatically finds the nearest upstream node that's linked to a form.",
      "Pick a field from that form, an operator (equals / not equals / greater than / less than), and a value.",
    ],
    body: [
      "This is the flow-side business rule engine hook: instead of a free-text guess like \"carrier route?\", the branch can actually check the value submitted for a specific field, e.g. carrier_type equals ammonia.",
    ],
    relatedTopicIds: ["flow-edge-kinds"],
  },
  {
    id: "flow-validate",
    scope: "flow",
    title: "What Validate graph checks",
    summary: "Real structural checks: orphans, unreachable nodes, unmarked cycles, missing form links.",
    body: [
      "Errors (block publishing): a node with no connections at all; a node unreachable from the start; a cycle that isn't marked as a correction edge; a form/automation/document node whose linked form was deleted.",
      "Warnings (don't block, but worth fixing): a form step with no form linked yet; no milestone node; a milestone with outgoing edges; a branch with fewer than two paths or a path with no condition set.",
      "Click any row in the results to jump straight to the node or edge it's about.",
    ],
    relatedTopicIds: ["gs-publish"],
  },
  {
    id: "flow-auto-arrange",
    scope: "flow",
    title: "Auto-arrange",
    summary: "Lays nodes out in columns by how many steps they are from the start.",
    body: [
      "Auto-arrange groups nodes into columns based on their distance from the flow's starting point(s), and spreads nodes within the same column vertically — the same layered layout used by most flowchart and BPMN tools. Correction loops are ignored when computing columns so they don't drag earlier steps backward.",
    ],
  },

  // ---------- Form ----------
  {
    id: "stages-overview",
    scope: "form",
    title: "Stages: the process backbone",
    summary: "Stages are the ordered phases your process moves through — Setup, Source, Production...",
    body: [
      "A Stage groups the forms captured at one phase of the process (e.g. \"Facility Setup,\" \"Feedstock Source,\" \"Production\"). Stages are fully yours to edit, even on a pre-built domain pack: rename them, reorder them, add or remove forms, or create entirely new stages.",
      "Stages aren't just a label — they're what the flow is generated from. Reorder your stages or add a form to one, then open the flow and click \"Sync from stages\" to bring the process diagram up to date.",
    ],
    steps: [
      "Use the ↑/↓ buttons on a stage to move it earlier or later in the process.",
      "Use \"New form\" or \"Add existing form\" inside a stage to put a form in it (each form belongs to one stage).",
      "Use \"New stage\" at the bottom of the page to add a phase that doesn't exist yet.",
    ],
    relatedTopicIds: ["stages-connectors", "flow-sync", "gs-entities"],
  },
  {
    id: "stages-connectors",
    scope: "form",
    title: "Binding connectors to a stage",
    summary: "Attach a SCADA/PLC/device feed to a stage so its automation status is visible at a glance.",
    body: [
      "Binding one or more connectors to a stage doesn't change any form logic — it's purely for visibility, so anyone looking at the process can see which stages are backed by live automation (green = connected, amber = degraded, red = disconnected) without digging into the Connectors page.",
      "Individual fields still use their own lookup/telemetry configuration (see \"Lookup / connector fields\") to actually pull values — stage-level binding is a status readout on top of that.",
    ],
    relatedTopicIds: ["stages-overview", "form-lookup-select"],
  },
  {
    id: "form-overview",
    scope: "form",
    title: "What is a form?",
    summary: "A form is a data-entry template — its fields define one entity's shape.",
    body: [
      "A form defines what gets captured at one step of a flow: its fields, their types, validation, and how they relate to other forms. Every field you add here is a real column other forms and flow edges can later reference.",
      "Every form lives inside a Stage — see \"Stages: the process backbone\" for how stages, forms, and the flow relate.",
    ],
    relatedTopicIds: ["stages-overview", "gs-entities", "form-field-types"],
  },
  {
    id: "form-field-types",
    scope: "form",
    title: "Field type categories",
    summary: "Basic input, structured capture, connector-backed, and relational/computed types.",
    body: [
      "Basic input — short/long text, number, date, boolean, single/multi select.",
      "Structured capture — geo point/boundary, photo, document scan, signature, repeat group.",
      "Connector-backed — lookup / connector, which pulls its value from another form's records, a live device parameter, or an external database.",
      "Relational & computed — linked record (a foreign key to another entity) and calculated field (derived automatically, not editable by submitters).",
    ],
    relatedTopicIds: ["form-lookup-select", "form-linked-record"],
  },
  {
    id: "form-lookup-select",
    scope: "form",
    title: "Lookup / connector fields",
    summary: "Pulls its value from another form's records, a device parameter, or an external system.",
    steps: [
      "Add a \"Lookup / connector\" field and select it.",
      "Choose the source kind: internal form, device telemetry, or external DB.",
      "Internal form: pick the source entity, optionally pick which of its fields (columns) to display, and optionally add a filter (see \"Filtering links by column and value\").",
      "Device telemetry: pick a connected device, then one of its telemetry parameters.",
      "External DB: name the table and column being referenced (there's no live schema to browse yet, so these are typed directly), plus a refresh interval.",
    ],
    relatedTopicIds: ["form-link-filters", "gs-entities"],
  },
  {
    id: "form-linked-record",
    scope: "form",
    title: "Linked record fields",
    summary: "A real foreign key — which entity does this follow-up record get created against?",
    steps: [
      "Add a \"Linked record\" field and select it.",
      "Use the entity picker to choose which form/entity the follow-up record links to.",
      "Optionally narrow it with a filter, e.g. only allow linking to Production Batch records where batch_status equals approved.",
    ],
    relatedTopicIds: ["form-link-filters"],
  },
  {
    id: "form-link-filters",
    scope: "form",
    title: "Filtering links by column and value",
    summary: "Links aren't limited to a whole entity — narrow them to a column and a value too.",
    body: [
      "Both lookup and linked-record fields can carry an optional filter: pick a field (column) on the target entity, an operator (equals / not equals / contains), and a value. That turns \"link to Facility Setup\" into \"link to Facility Setup where facility_type equals Gasification\" — the same shape as a WHERE clause.",
      "This is what makes links flexible instead of all-or-nothing: you're not just pointing at another table, you're pointing at a specific column, and optionally a specific value within it.",
    ],
    relatedTopicIds: ["form-lookup-select", "form-linked-record"],
  },
  {
    id: "form-validation-rules",
    scope: "form",
    title: "Validation rules (BRE)",
    summary: "Structured, per-field rules with an outcome: pass, warning, hard stop, or send to review.",
    body: [
      "Required, range (min/max), regex (pattern), reconciliation (compare against another field on this form within a tolerance %), duplicate check (a set of fields that together must be unique), plus image quality / OCR confidence / spatial checks for media fields.",
      "Every rule has an outcome that decides what happens when it fails: pass silently, warn, hard-stop the submission, or route it to manual review.",
    ],
    relatedTopicIds: ["form-visibility-rules"],
  },
  {
    id: "form-visibility-rules",
    scope: "form",
    title: "Visibility rules",
    summary: "Show or hide other fields based on this field's answer.",
    steps: [
      "Select the controlling field (the one whose answer decides visibility).",
      "Add a rule: the value it must equal, and which fields to reveal when it matches.",
      "Try it in Preview — change the controlling field's value and watch dependent fields appear/disappear.",
    ],
  },
  {
    id: "form-preview",
    scope: "form",
    title: "Preview",
    summary: "A live, fillable rendering of the form — the best way to test visibility rules.",
    body: [
      "Preview renders real inputs for text/number/date/boolean fields and evaluates visibility rules against what you type. Lookup, linked-record, and calculated fields show as read-only placeholders since there's no live backend to query in this prototype.",
    ],
  },
];

export function getKnowledgeTopic(id: string): KnowledgeTopic | undefined {
  return knowledgeBase.find((topic) => topic.id === id);
}

export function getKnowledgeTopicsByScope(scope: KnowledgeScope): KnowledgeTopic[] {
  return knowledgeBase.filter((topic) => topic.scope === scope || topic.scope === "general");
}
