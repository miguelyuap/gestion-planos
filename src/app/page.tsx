import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentStudioContext } from '@/modules/auth/actions/auth.actions';
import { BlueprintStudio } from '@/modules/studio-ui/BlueprintStudio';

export default async function HomePage() {
  const ctx = await getCurrentStudioContext();

  if (!ctx) {
    redirect('/login');
  }

  if (!ctx.license.can_operate) {
    redirect('/suscripcion');
  }

  return (
    <BlueprintStudio
      initialSession={ctx.session}
      initialLicense={ctx.license}
    />
  );
}
