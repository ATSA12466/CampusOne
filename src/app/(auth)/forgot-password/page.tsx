import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata = routeMetadata("forgot-password");

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      description="We'll send a reset link once backend email integration is connected."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
