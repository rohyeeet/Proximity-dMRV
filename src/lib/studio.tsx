"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { formTemplates, flowTemplates, stages as stageTemplates } from "@/data";
import { genId } from "@/lib/utils";
import type { FormTemplate, FlowTemplate, Stage } from "@/types";

const STORAGE_KEY = "proximity-studio-v1";

interface FormEntry {
  data: FormTemplate;
  dirty: boolean;
}

interface FlowEntry {
  data: FlowTemplate;
  dirty: boolean;
}

interface StageEntry {
  data: Stage;
  dirty: boolean;
}

interface PersistedShape {
  forms: Record<string, FormEntry>;
  flows: Record<string, FlowEntry>;
  stages: Record<string, StageEntry>;
  formOrder: string[];
  flowOrder: string[];
  stageOrder: string[];
}

function cloneForms(): Record<string, FormEntry> {
  return Object.fromEntries(
    formTemplates.map((form) => [form.id, { data: structuredClone(form), dirty: false }])
  );
}

function cloneFlows(): Record<string, FlowEntry> {
  return Object.fromEntries(
    flowTemplates.map((flow) => [flow.id, { data: structuredClone(flow), dirty: false }])
  );
}

function cloneStages(): Record<string, StageEntry> {
  return Object.fromEntries(
    stageTemplates.map((stage) => [stage.id, { data: structuredClone(stage), dirty: false }])
  );
}

interface StudioContextValue {
  forms: FormTemplate[];
  flows: FlowTemplate[];
  stages: Stage[];
  getForm: (id: string) => FormTemplate | undefined;
  getFlow: (id: string) => FlowTemplate | undefined;
  getStage: (id: string) => Stage | undefined;
  isFormDirty: (id: string) => boolean;
  isFlowDirty: (id: string) => boolean;
  isStageDirty: (id: string) => boolean;
  updateForm: (id: string, updater: (prev: FormTemplate) => FormTemplate) => void;
  updateFlow: (id: string, updater: (prev: FlowTemplate) => FlowTemplate) => void;
  updateStage: (id: string, updater: (prev: Stage) => Stage) => void;
  publishForm: (id: string) => void;
  publishFlow: (id: string) => void;
  createForm: (domainPackId: string) => string;
  createFlow: (domainPackId: string) => string;
  createStage: (domainPackId: string) => string;
  createFormInStage: (stageId: string) => string;
  moveStage: (id: string, direction: -1 | 1) => void;
  addFormToStage: (stageId: string, formId: string) => void;
  removeFormFromStage: (stageId: string, formId: string) => void;
  moveFormInStage: (stageId: string, formId: string, direction: -1 | 1) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [forms, setForms] = useState<Record<string, FormEntry>>(cloneForms);
  const [flows, setFlows] = useState<Record<string, FlowEntry>>(cloneFlows);
  const [stages, setStages] = useState<Record<string, StageEntry>>(cloneStages);
  const [formOrder, setFormOrder] = useState<string[]>(() => formTemplates.map((f) => f.id));
  const [flowOrder, setFlowOrder] = useState<string[]>(() => flowTemplates.map((f) => f.id));
  const [stageOrder, setStageOrder] = useState<string[]>(() => stageTemplates.map((s) => s.id));
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as PersistedShape;
        setForms((prev) => ({ ...prev, ...stored.forms }));
        setFlows((prev) => ({ ...prev, ...stored.flows }));
        setStages((prev) => ({ ...prev, ...stored.stages }));
        setFormOrder((prev) => {
          const merged = [...prev];
          for (const id of stored.formOrder ?? []) if (!merged.includes(id)) merged.push(id);
          return merged;
        });
        setFlowOrder((prev) => {
          const merged = [...prev];
          for (const id of stored.flowOrder ?? []) if (!merged.includes(id)) merged.push(id);
          return merged;
        });
        setStageOrder((prev) => {
          const merged = [...prev];
          for (const id of stored.stageOrder ?? []) if (!merged.includes(id)) merged.push(id);
          return merged;
        });
      }
    } catch {
      // corrupt or unavailable storage — fall back to static defaults
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const payload: PersistedShape = { forms, flows, stages, formOrder, flowOrder, stageOrder };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage full/unavailable — edits stay in-memory for this session
    }
  }, [forms, flows, stages, formOrder, flowOrder, stageOrder]);

  const value = useMemo<StudioContextValue>(() => {
    function getForm(id: string) {
      return forms[id]?.data;
    }
    function getFlow(id: string) {
      return flows[id]?.data;
    }
    function getStage(id: string) {
      return stages[id]?.data;
    }
    function updateForm(id: string, updater: (prev: FormTemplate) => FormTemplate) {
      setForms((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        return { ...prev, [id]: { data: updater(entry.data), dirty: true } };
      });
    }
    function updateFlow(id: string, updater: (prev: FlowTemplate) => FlowTemplate) {
      setFlows((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        return { ...prev, [id]: { data: updater(entry.data), dirty: true } };
      });
    }
    function updateStage(id: string, updater: (prev: Stage) => Stage) {
      setStages((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        return { ...prev, [id]: { data: updater(entry.data), dirty: true } };
      });
    }
    function publishForm(id: string) {
      setForms((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        const nextVersion = entry.data.currentVersion.versionNo + 1;
        return {
          ...prev,
          [id]: {
            dirty: false,
            data: {
              ...entry.data,
              currentVersion: { ...entry.data.currentVersion, versionNo: nextVersion, publishedAt: new Date().toISOString() },
            },
          },
        };
      });
    }
    function publishFlow(id: string) {
      setFlows((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        return {
          ...prev,
          [id]: {
            dirty: false,
            data: { ...entry.data, versionNo: entry.data.versionNo + 1, status: "published" },
          },
        };
      });
    }
    function createForm(domainPackId: string): string {
      const id = genId("form-custom");
      const form: FormTemplate = {
        id,
        domainPackId,
        code: id.replace(/-/g, "_"),
        name: "Untitled form",
        description: "",
        category: "Custom",
        submissionCount: 0,
        needsCheckCount: 0,
        needsFixCount: 0,
        currentVersion: { versionNo: 0, publishedAt: new Date().toISOString(), fields: [] },
      };
      setForms((prev) => ({ ...prev, [id]: { data: form, dirty: true } }));
      setFormOrder((prev) => [...prev, id]);
      return id;
    }
    function createFlow(domainPackId: string): string {
      const id = genId("flow-custom");
      const flow: FlowTemplate = {
        id,
        domainPackId,
        code: id.replace(/-/g, "_"),
        name: "Untitled flow",
        status: "draft",
        versionNo: 0,
        triggerLabel: "Manually triggered",
        nodes: [],
        edges: [],
      };
      setFlows((prev) => ({ ...prev, [id]: { data: flow, dirty: true } }));
      setFlowOrder((prev) => [...prev, id]);
      return id;
    }
    function createStage(domainPackId: string): string {
      const id = genId("stage-custom");
      const stage: Stage = { id, domainPackId, name: "Untitled stage", sortOrder: 0, connectorIds: [], formTemplateIds: [] };
      setStages((prev) => ({ ...prev, [id]: { data: stage, dirty: true } }));
      setStageOrder((prev) => [...prev, id]);
      return id;
    }
    function createFormInStage(stageId: string): string {
      const stage = stages[stageId]?.data;
      if (!stage) throw new Error(`Unknown stage: ${stageId}`);
      const id = createForm(stage.domainPackId);
      setForms((prev) => {
        const entry = prev[id];
        if (!entry) return prev;
        return { ...prev, [id]: { data: { ...entry.data, category: stage.name }, dirty: true } };
      });
      setStages((prev) => {
        const entry = prev[stageId];
        if (!entry) return prev;
        return { ...prev, [stageId]: { data: { ...entry.data, formTemplateIds: [...entry.data.formTemplateIds, id] }, dirty: true } };
      });
      return id;
    }
    function moveStage(id: string, direction: -1 | 1) {
      setStageOrder((prev) => {
        const index = prev.indexOf(id);
        const targetIndex = index + direction;
        if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
        const next = [...prev];
        const tmp = next[index]!;
        next[index] = next[targetIndex]!;
        next[targetIndex] = tmp;
        return next;
      });
    }
    function addFormToStage(stageId: string, formId: string) {
      updateStage(stageId, (prev) => (prev.formTemplateIds.includes(formId) ? prev : { ...prev, formTemplateIds: [...prev.formTemplateIds, formId] }));
    }
    function removeFormFromStage(stageId: string, formId: string) {
      updateStage(stageId, (prev) => ({ ...prev, formTemplateIds: prev.formTemplateIds.filter((fid) => fid !== formId) }));
    }
    function moveFormInStage(stageId: string, formId: string, direction: -1 | 1) {
      updateStage(stageId, (prev) => {
        const index = prev.formTemplateIds.indexOf(formId);
        const targetIndex = index + direction;
        if (index === -1 || targetIndex < 0 || targetIndex >= prev.formTemplateIds.length) return prev;
        const next = [...prev.formTemplateIds];
        const tmp = next[index]!;
        next[index] = next[targetIndex]!;
        next[targetIndex] = tmp;
        return { ...prev, formTemplateIds: next };
      });
    }

    return {
      forms: formOrder.map((id) => forms[id]?.data).filter((f): f is FormTemplate => Boolean(f)),
      flows: flowOrder.map((id) => flows[id]?.data).filter((f): f is FlowTemplate => Boolean(f)),
      stages: stageOrder.map((id) => stages[id]?.data).filter((s): s is Stage => Boolean(s)),
      getForm,
      getFlow,
      getStage,
      isFormDirty: (id) => forms[id]?.dirty ?? false,
      isFlowDirty: (id) => flows[id]?.dirty ?? false,
      isStageDirty: (id) => stages[id]?.dirty ?? false,
      updateForm,
      updateFlow,
      updateStage,
      publishForm,
      publishFlow,
      createForm,
      createFlow,
      createStage,
      createFormInStage,
      moveStage,
      addFormToStage,
      removeFormFromStage,
      moveFormInStage,
    };
  }, [forms, flows, stages, formOrder, flowOrder, stageOrder]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
