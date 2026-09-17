import type { Condition, PropertyType, RoomType, ScopeLevel } from "@/lib/types";

export interface WizardPhoto {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
}

export interface WizardState {
  propertyType: PropertyType;
  isOwner: boolean;
  roomType: RoomType;
  scopeLevel: ScopeLevel;
  projectSummary: string;
  photos: WizardPhoto[];
  lengthFt: number;
  widthFt: number;
  ceilingHeightFt: number;
  currentCondition: Condition;
  wishlist: string[];
  notes: string;
  budgetCad: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  propertyType: "house",
  isOwner: true,
  roomType: "bathroom",
  scopeLevel: "moderate",
  projectSummary: "",
  photos: [],
  lengthFt: 10,
  widthFt: 8,
  ceilingHeightFt: 8,
  currentCondition: "fair",
  wishlist: [],
  notes: "",
  budgetCad: 15000,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export interface WizardStepProps {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}
