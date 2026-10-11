"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { onboardingService } from "@/services";
import { levels, programmes } from "@/config/onboarding";
import { authStorageKey, onboardingStorageKey } from "@/config/auth";
import { storageFailed } from "@/lib/auth/persistence";
import { profileSetupSchema, type ProfileSetupValues } from "../validation/profile.schema";
import { PhotoPicker } from "./photo-picker";
import { InterestPicker } from "./interest-picker";
export function ProfileSetup({ next, onBack }: { next: string; onBack: () => void }) {
  const router = useRouter(),
    toast = useToast();
  const user = useAuthStore((state) => state.user),
    source = useAuthStore((state) => state.source);
  const preferences = useOnboardingStore((state) => state.preferences);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSetupValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: preferences.name || user?.name || "",
      programme:
        (preferences.name ? undefined : programmes.find((p) => p === user?.programme)) ??
        (preferences.programme as ProfileSetupValues["programme"]),
      level:
        (preferences.name ? undefined : levels.find((p) => p === user?.level)) ??
        (preferences.level as ProfileSetupValues["level"]),
      interests: preferences.interests as ProfileSetupValues["interests"],
      portrait: preferences.portrait,
    },
  });
  const name = useWatch({ control, name: "name" });
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        useOnboardingStore.getState().setPreferences(values);
        if (source === "demo")
          useAuthStore.getState().setDemoProfile(onboardingService.personalizeDemo(user, values));
        useOnboardingStore.getState().completeOnboarding();
        const failed = storageFailed(authStorageKey) || storageFailed(onboardingStorageKey);
        toast({
          title: failed ? "Ready for this visit" : "Your campus, your way",
          description: failed
            ? "Device storage is unavailable. Preferences won't survive reload."
            : "Local preferences saved. The demo feed is not personalized yet.",
          tone: "success",
        });
        router.replace(next);
      })}
    >
      <Field id="setup-name" label="Your name" required error={errors.name?.message}>
        <Input
          id="setup-name"
          maxLength={80}
          autoComplete="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "setup-name-error" : undefined}
        />
      </Field>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[1.7fr_1fr]">
        <Field
          id="setup-programme"
          label="Demo programme"
          required
          error={errors.programme?.message}
        >
          <Select id="setup-programme" {...register("programme")} aria-invalid={!!errors.programme}>
            {programmes.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field id="setup-level" label="Level" required error={errors.level?.message}>
          <Select id="setup-level" {...register("level")} aria-invalid={!!errors.level}>
            {levels.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Illustrative programme choices, not an official admissions list. Saved locally; no
        university record is changed.
      </p>
      <Controller
        name="portrait"
        control={control}
        render={({ field }) => (
          <PhotoPicker name={name} value={field.value} onChange={field.onChange} />
        )}
      />
      <InterestPicker control={control} />
      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={() => {
            useOnboardingStore.getState().setPreferences(getValues());
            onBack();
          }}
        >
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Finish and continue
        </Button>
      </div>
    </form>
  );
}
