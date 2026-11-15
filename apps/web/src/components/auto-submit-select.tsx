"use client";

import type { ComponentProps } from "react";
import { Select } from "@/components/ui";

// Select que envía su formulario al cambiar de valor.
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <Select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
