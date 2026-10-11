"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { OwnedPhoto } from "@/components/media/owned-photo";
import { imageForSrc } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { profileService } from "@/services";
import { useAuthAction } from "@/features/auth/hooks/use-auth-action";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { ProfileEditor } from "./profile-editor";
import { ProfilePhoto } from "./profile-photo";
import { ProfileActivity } from "./profile-activity";
import type { ProfilePreferences } from "@/types/profile";
export function OwnedProfile() {
  const user = useAuthStore((s) => s.user)!,
    photo = useAuthStore((s) => s.photo),
    workspace = useWorkspace("profile"),
    action = useAuthAction(),
    [notice, setNotice] = useState("");
  const cancel = action.cancel;
  useEffect(() => () => cancel(), [cancel]);
  const profile: ProfilePreferences = workspace.items[0] ?? {
    id: "profile",
    name: user.name,
    programme: user.programme,
    level: user.level,
    bio: "",
    interests: "",
    visibility: "private",
    showProgramme: "yes",
  };
  const save = async (input: ProfilePreferences) => {
    const result = await action.run((signal) =>
      profileService.save(input, { signal }),
    );
    if (!result)
      throw new Error(
        "Profile changes were not confirmed. Your inputs are still here.",
      );
    setNotice(
      result.persisted
        ? "Profile preferences saved. Demo changes stay on this device; API mode requires a connected service."
        : "Saved for this visit only; device storage is unavailable.",
    );
    workspace.refresh();
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit space-y-5">
        {profile.photo ? (
          <OwnedPhoto
            data={profile.photo}
            aspect="square"
            alt={`Your privately saved profile photo for ${profile.name}`}
          />
        ) : (
          <Avatar
            size="xl"
            name={profile.name}
            image={photo ?? imageForSrc(user.avatar ?? "")}
          />
        )}
        <div>
          <h2
            id="profile-identity-title"
            tabIndex={-1}
            className="break-words font-display text-2xl font-semibold"
          >
            {profile.name}
          </h2>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            {user.email}
          </p>
          {profile.showProgramme === "yes" ? (
            <p className="mt-2 text-sm">
              {profile.programme} · {profile.level}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {user.role.replaceAll("-", " ")} ·{" "}
            {profile.visibility === "private"
              ? "Private preference"
              : "Campus preview preference"}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your profile is not publicly published. Visibility is a saved
          preference for a future connected service. Role/email are not editable
          here.
        </p>
        {workspace.error ? (
          <div role="alert">
            <p>{workspace.error}</p>
            <button className="min-h-11 text-brand" onClick={workspace.refresh}>
              Retry profile
            </button>
          </div>
        ) : workspace.loading ? (
          <p role="status">Loading your preferences…</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <ProfileEditor
              profile={profile}
              busy={action.pending}
              onSave={save}
            />
            <ProfilePhoto
              profile={profile}
              busy={action.pending}
              owner={workspace.owner}
              onSave={save}
            />
          </div>
        )}
        {action.error ? (
          <p role="alert" className="text-sm text-danger">
            {action.error}
          </p>
        ) : null}
      </Card>
      <div className="space-y-8">
        {notice ? (
          <p
            role="status"
            className="rounded-control bg-surface-muted p-4 text-sm"
          >
            {notice}
          </p>
        ) : null}
        <Card>
          <h2 className="font-display text-2xl font-semibold">
            Your corner of campus.
          </h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {profile.bio ||
              "A good story starts with a few words. Edit your profile to tell yourself what you want to make room for this semester."}
          </p>
          {profile.interests ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Curious about: {profile.interests}
            </p>
          ) : null}
        </Card>
        <ProfileActivity />
      </div>
    </div>
  );
}
