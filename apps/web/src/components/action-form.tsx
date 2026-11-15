"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, cx, type ButtonSize, type ButtonVariant } from "@/components/ui";

export type FormState = { ok?: boolean; error?: string; message?: string };
export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;


// Formulario para acciones del servidor: muestra el error o la confirmación
// y conserva lo escrito cuando la acción falla.
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const data = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(data));
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.error ? (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p role="status" className="mt-3 rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm text-brand-dark">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

// Botón para formularios simples (<form action={accion}>): se desactiva
// mientras la acción corre.
export function SubmitButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      className={cx(buttonClass(variant, size), className)}
    >
      {children}
    </button>
  );
}
