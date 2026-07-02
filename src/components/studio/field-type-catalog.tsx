import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  CalendarClock,
  ToggleLeft,
  List,
  ListChecks,
  MapPin,
  Map as MapIcon,
  Camera,
  ScanLine,
  PenTool,
  Repeat,
  Search,
  Link2,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import type { FieldType } from "@/types";

export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  icon: LucideIcon;
}

export const fieldTypeCatalog: { category: string; types: FieldTypeMeta[] }[] = [
  {
    category: "Basic input",
    types: [
      { type: "short_text", label: "Short text", icon: Type },
      { type: "long_text", label: "Long text", icon: AlignLeft },
      { type: "number", label: "Number", icon: Hash },
      { type: "date", label: "Date", icon: Calendar },
      { type: "datetime", label: "Date & time", icon: CalendarClock },
      { type: "boolean", label: "Yes / No", icon: ToggleLeft },
      { type: "single_select", label: "Single select", icon: List },
      { type: "multi_select", label: "Multi select", icon: ListChecks },
    ],
  },
  {
    category: "Structured capture",
    types: [
      { type: "geo_point", label: "Geo point", icon: MapPin },
      { type: "geo_boundary", label: "Geo boundary", icon: MapIcon },
      { type: "photo", label: "Photo", icon: Camera },
      { type: "document_scan", label: "Document scan", icon: ScanLine },
      { type: "signature", label: "Signature", icon: PenTool },
      { type: "repeat_group", label: "Repeat group", icon: Repeat },
    ],
  },
  {
    category: "Connector-backed",
    types: [{ type: "lookup_select", label: "Lookup / connector", icon: Search }],
  },
  {
    category: "Relational & computed",
    types: [
      { type: "linked_record", label: "Linked record", icon: Link2 },
      { type: "calculated_field", label: "Calculated field", icon: Sigma },
    ],
  },
];

export const fieldTypeMetaByType: Record<FieldType, FieldTypeMeta> = fieldTypeCatalog
  .flatMap((group) => group.types)
  .reduce((acc, meta) => ({ ...acc, [meta.type]: meta }), {} as Record<FieldType, FieldTypeMeta>);
