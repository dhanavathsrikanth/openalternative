# Organization Roles & Permission Matrix

## Roles

| Role        | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| **Owner**   | Full control. Can manage org settings, billing, members, and all content. |
| **Admin**   | Can manage members and all content. Cannot delete the org or transfer ownership. |
| **Editor**  | Can create, edit, and publish products, collections, and guides. |
| **Marketing** | Can manage products, collections, guides, and newsletter content. Cannot manage members. |
| **Viewer**  | Read-only access to the dashboard. Cannot perform any mutations. |

## Permission Matrix

| Action                         | Owner | Admin | Editor | Marketing | Viewer |
| ------------------------------ | :---: | :---: | :----: | :-------: | :----: |
| **Org settings**               |       |       |        |           |        |
| Update org name                |  ✅   |  ❌   |   ❌   |    ❌     |   ❌   |
| Delete org                     |  ✅   |  ❌   |   ❌   |    ❌     |   ❌   |
| Transfer ownership             |  ✅   |  ❌   |   ❌   |    ❌     |   ❌   |
| **Members**                    |       |       |        |           |        |
| Invite member                  |  ✅   |  ✅   |   ❌   |    ❌     |   ❌   |
| Remove member                  |  ✅   |  ✅   |   ❌   |    ❌     |   ❌   |
| Change member role             |  ✅   |  ✅   |   ❌   |    ❌     |   ❌   |
| **Products**                   |       |       |        |           |        |
| View product                   |  ✅   |  ✅   |   ✅   |    ✅     |   ✅   |
| Create product                 |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Edit product                   |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Delete product                 |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| Publish product                |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| **Collections**                |       |       |        |           |        |
| View collection                |  ✅   |  ✅   |   ✅   |    ✅     |   ✅   |
| Create collection              |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Edit collection                |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Delete collection              |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| **Guides**                     |       |       |        |           |        |
| View guide                     |  ✅   |  ✅   |   ✅   |    ✅     |   ✅   |
| Create guide                   |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Edit guide                     |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| Delete guide                   |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| Publish guide                  |  ✅   |  ✅   |   ✅   |    ✅     |   ❌   |
| **Contributions**              |       |       |        |           |        |
| Review contribution            |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| Approve/reject contribution    |  ✅   |  ✅   |   ✅   |    ❌     |   ❌   |
| **Newsletter**                 |       |       |        |           |        |
| Manage newsletter subscribers  |  ✅   |  ✅   |   ❌   |    ✅     |   ❌   |
| **Cron / Internal**            |       |       |        |           |        |
| Run cron jobs                  |  ✅   |  ✅   |   ❌   |    ❌     |   ❌   |

## Enforcement Rules

1. **Never trust client-supplied `organizationId` or `role`.** Always derive the current
   user's org membership and role from the Clerk session token at the server boundary.
2. All mutations under `/dashboard/**` and `/admin/**` must call `requireOrgRole()` or
   `requirePermission()` before executing.
3. The middleware at the edge gates access to `/dashboard/**` and `/admin/**` by verifying
   the user is authenticated and belongs to an organization. Role-level checks happen
   inside individual route handlers or server actions.
