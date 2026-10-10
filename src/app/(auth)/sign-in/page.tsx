import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata = routeMetadata("sign-in");

export default function SignInPage() {
  return (
    <AuthLayout title="Sign in to CampusOne" description="Access your student workspace.">
      <SignInForm />
    </AuthLayout>
  );
}
