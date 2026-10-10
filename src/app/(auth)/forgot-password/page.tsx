import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot your password?" description="We'll send a reset link once backend email integration is connected.">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
