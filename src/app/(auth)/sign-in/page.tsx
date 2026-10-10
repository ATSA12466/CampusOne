import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <AuthLayout title="Sign in to CampusOne" description="Access your student workspace.">
      <SignInForm />
    </AuthLayout>
  );
}
