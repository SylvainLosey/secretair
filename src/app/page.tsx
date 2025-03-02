import { PageLayout } from "~/components/ui/PageLayout";
import { Wizard } from "~/components/Wizard";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <PageLayout>
        <Wizard />
      </PageLayout>
    </HydrateClient>
  );
}
