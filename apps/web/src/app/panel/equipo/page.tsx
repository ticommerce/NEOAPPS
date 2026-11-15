import { getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, Field, Input, Select } from "@/components/ui";
import { getPanelContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { changeRole, inviteMember, removeMember, revokeInvitation } from "../actions";

export default async function TeamPage() {
  const ctx = await getPanelContext();
  const t = await getTranslations("panel.team");
  const tRoles = await getTranslations("panel.roles");
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("business_id", ctx.business.id)
    .order("created_at");
  const ids = (memberships ?? []).map((m) => m.user_id);
  const [{ data: profiles }, { data: invitations }] = await Promise.all([
    supabase.from("profiles").select("user_id, email, full_name").in("user_id", ids),
    ctx.isOwner
      ? supabase.from("invitations").select("id, email, role").eq("business_id", ctx.business.id).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {(memberships ?? []).map((member) => {
            const profile = profileById.get(member.user_id);
            const isSelf = member.user_id === ctx.userId;
            return (
              <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {profile?.full_name || profile?.email || t("unknown")}
                    {isSelf ? <span className="text-muted"> · {t("you")}</span> : null}
                  </p>
                  <p className="truncate text-sm text-muted">{profile?.email}</p>
                </div>
                {ctx.isOwner && !isSelf ? (
                  <div className="flex flex-wrap items-start gap-2">
                    <ActionForm action={changeRole.bind(null, member.user_id)}>
                      <div className="flex gap-2">
                        <Select name="role" defaultValue={member.role} aria-label={t("role")} className="w-36 py-1.5">
                          <option value="owner">{tRoles("owner")}</option>
                          <option value="employee">{tRoles("employee")}</option>
                        </Select>
                        <SubmitButton variant="secondary" size="sm">
                          {t("save")}
                        </SubmitButton>
                      </div>
                    </ActionForm>
                    <ActionForm action={removeMember.bind(null, member.user_id)}>
                      <SubmitButton variant="danger" size="sm">
                        {t("remove")}
                      </SubmitButton>
                    </ActionForm>
                  </div>
                ) : (
                  <Badge tone={member.role === "owner" ? "brand" : "neutral"}>{tRoles(member.role)}</Badge>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {ctx.isOwner ? (
        <Card className="mt-6">
          <h2 className="font-display text-lg font-bold">{t("invite.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("invite.lead")}</p>
          <ActionForm action={inviteMember} resetOnSuccess className="mt-4">
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_10rem_auto]">
              <Field label={t("invite.email")}>
                <Input name="email" type="email" required maxLength={200} />
              </Field>
              <Field label={t("role")}>
                <Select name="role" defaultValue="employee">
                  <option value="employee">{tRoles("employee")}</option>
                  <option value="owner">{tRoles("owner")}</option>
                </Select>
              </Field>
              <SubmitButton>{t("invite.submit")}</SubmitButton>
            </div>
          </ActionForm>

          {(invitations ?? []).length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-semibold text-muted">{t("invite.pending")}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {(invitations ?? []).map((invitation) => (
                  <li key={invitation.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      {invitation.email} · <span className="text-muted">{tRoles(invitation.role)}</span>
                    </span>
                    <form action={revokeInvitation.bind(null, invitation.id)}>
                      <SubmitButton variant="danger" size="sm">
                        {t("invite.revoke")}
                      </SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : (
        <p className="mt-5 text-sm text-muted">{t("ownerOnly")}</p>
      )}
    </>
  );
}
