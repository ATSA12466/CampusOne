import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { authRouteOptions } from "@/features/auth/route-options";
export const metadata = routeMetadata("forgot-password");
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = await authRouteOptions(searchParams);
  return (
    <AuthLayout
      title="Let’s get you back."
      description="A small step back toward your workspace. Email delivery requires a connected service."
      story="recovery"
    >
      <ForgotPasswordForm {...options} />
    </AuthLayout>
  );
}
