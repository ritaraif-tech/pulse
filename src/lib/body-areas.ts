export const bodyAreas = [
  { id: "joints", label: "Joints" },
  { id: "flexibility", label: "Flexibility" },
  { id: "skin", label: "Skin" },
  { id: "hair", label: "Hair" },
  { id: "vision", label: "Vision" },
  { id: "hearing", label: "Hearing" },
  { id: "sleep", label: "Sleep" },
  { id: "digestion", label: "Digestion" },
  { id: "memory", label: "Memory / focus" },
  { id: "hormonal", label: "Hormonal" },
  { id: "recovery", label: "Energy / recovery" },
  { id: "other", label: "Other" },
]

export const bodyAreaLabel = (id: string) =>
  bodyAreas.find((a) => a.id === id)?.label ?? id
