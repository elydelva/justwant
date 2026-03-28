# @justwant/organisation

Organisations with membership + permission. defineOrganisation, createStandardOrganisationMembership, createOrganisationService.

## Usage

```ts
import {
  createOrganisationService,
  defineOrganisation,
  createStandardOrganisationMembership,
  createStandardOrganisationPermission,
} from "@justwant/organisation";

const { group } = createStandardOrganisationMembership({ name: "organisation", member });
const { realm } = createStandardOrganisationPermission({ name: "organisation", actor });
const OrganisationOrg = defineOrganisation({ name: "organisation", realm, group });

const org = createOrganisationService({ repo, deps: { membership, permission }, organisations: [OrganisationOrg] });

await org.create({ name: "Acme", slug: "acme", type: "organisation" });
await org.addMember({ organisation: acme, member: { id: alice.id }, role: "owner" });
await org.can({ organisation: acme, member: alice, permission: OrganisationPermissions.organisationDelete });
```
