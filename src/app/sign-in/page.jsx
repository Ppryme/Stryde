import SignInClient from "@/app/sign-in/SignInClient";

export default async function SignInPage({
  searchParams,
}) {
  const params = await searchParams;

  return (
    <SignInClient
      authError={params?.error}
    />
  );
}
