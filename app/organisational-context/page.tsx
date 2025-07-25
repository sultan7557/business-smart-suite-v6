import { hasPermission } from "@/lib/auth";
import { getOrganizationalContextEntries } from "@/app/actions/organizational-context-actions";
import OrganizationalContextClient from "./organizational-context-client";

export default async function OrganizationalContextPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string }>;
}) {
  const canEdit = await hasPermission("write");
  const canDelete = await hasPermission("delete");

  // Await searchParams and ensure showArchived is a boolean
  const sp = await searchParams;
  const showArchived = sp.showArchived === "true";

  // Fetch organizational context entries
  const result = await getOrganizationalContextEntries(showArchived);
  const entries = result.success ? result.data : [];

  return (
    <div className="p-4">
      <OrganizationalContextClient
        entries={entries}
        canEdit={canEdit}
        canDelete={canDelete}
        showArchived={showArchived}
      />
    </div>
  );
}