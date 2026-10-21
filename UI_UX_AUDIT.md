# UI/UX Audit & Design Direction

This document is the product UI/UX source of truth for future interface work in this repository. Read it before changing page structure, navigation, shared components, or visual tokens. It records findings from the existing code and the approved direction; it does not mean implementation has started.

## Product scope

Hủ Design Studio is an internal studio-management app for client relationships, design work, quotations, service pricing, and content production. It also includes a client-facing portal. The current implementation is a React/Vite single-page application with local-storage-backed navigation state, Firebase Firestore synchronization, Tailwind CSS v4, and light/dark themes.

### Existing screens and capabilities to preserve

- **Overview:** client, design, quotation and video metrics; urgent design/deadline items; shortcuts to common workflows.
- **Clients & Design:** client search/status filters, selected-client details, design work and briefs, status/priority/deadline updates, quotation handoff, client portal preview/share.
- **Service Pricing:** pricing boards, package and terms editor, AI assistance, preview, save/duplicate, image export/copy and client sharing.
- **Quotations:** editor, preview and history; client selection, line items, totals/tax, save and print/export.
- **Content:** Fanpage planning and approval, brand guidelines, weekly/monthly plans, post briefs, AI planning/ideas and print/export; separate video idea/script pipeline with Kanban/table, search/platform filters and AI script creation.
- **Client portal:** progress, service/package information and quotations, addressed by client slug.
- **Studio settings:** studio and payment details, Firestore/Drive connections, JSON backup/restore and data reset.

Do not remove these capabilities or change their underlying business rules as part of UI work.

## Findings from the current code

### High priority

1. **Quick-create actions do not consistently open create forms.** Sidebar callbacks for new clients and design work only switch to the Clients & Design tab; the form state remains inside that page. The sidebar accepts an `onOpenNewQuote` callback but does not render an action that calls it. Make any control labeled “create” open the matching form, or label it clearly as navigation.
2. **The Video Content KPI lands in the wrong submodule.** It navigates to Content Planner, whose initial submodule is Fanpage planning. Preserve the KPI but route it to Video Scripts explicitly.
3. **Fanpage planning and video scripts are distinct jobs under one generic navigation label.** Give each a clear destination under a shared Content group so users can predict where a link leads and dashboards can target the correct workflow.
4. **Action toolbars compete for attention.** Pricing and Fanpage planning expose many same-weight controls together (create, AI, save, duplicate, preview, share, export, reset and selectors). Establish one primary action per page/region and group secondary actions under a clearly named “More actions” menu or toolbar section.

### Medium priority

5. Admin tabs are kept in localStorage, not represented by navigable URLs. Direct linking and browser back/forward between admin screens are limited.
6. Colors, typography sizes, radius and shadows vary across modules. The global CSS mainly defines font, scrollbar and print rules; most component styling is independently embedded in Tailwind class strings. Small 9–12px text is common in controls and labels.
7. Dialogs are implemented in many components as independent overlay `div`s. A shared dialog/focus-management pattern is not evident in the source; verify accessible names, Escape handling, focus trapping/restoration and keyboard focus visibility during implementation.
8. Sidebar receives `isCloudSynced`, but its “Online” badge is static and does not use the prop. Connection/sync indicators should show the real state and provide a useful recovery path.
9. Large screens/components mix many concerns: `ClientDesignManager.tsx`, `ServicePricingManager.tsx`, `QuotationGenerator.tsx` and `FanpageWeeklyPlanner.tsx` each contain extensive view state and UI. Extract shared patterns incrementally without changing data behavior.

## Approved information architecture

```text
Hủ Design Studio
├── Tổng quan
├── Khách hàng & Dự án
│   ├── Danh sách khách hàng
│   └── Việc thiết kế / brief
├── Báo giá
├── Bảng giá dịch vụ
├── Nội dung
│   ├── Kế hoạch Fanpage
│   └── Kịch bản Video
└── Cài đặt Studio

Portal khách hàng (route riêng theo slug)
├── Tiến độ dự án
├── Gói / bảng giá
└── Báo giá
```

Use a grouped sidebar. Put a global **Tạo mới** menu near the page header or another consistently available location, with entries for client, design work, quotation and content. Keep theme and settings in the sidebar footer. Do not duplicate the same create action in several toolbars unless context makes it materially faster.

## Page layout direction

- **Overview:** show “Needs attention” (upcoming deadlines and items awaiting client review) before summary metrics. Keep four core KPI groups and one global create action. KPI links must land in the matching destination, including Video Scripts.
- **Clients & Design:** retain the existing directory-plus-selected-client-detail pattern. Keep search/status controls close to the directory. Structure selected-client detail into focused sections/tabs such as Overview, Design work, Quotations and Portal. On mobile, show the directory first and provide an explicit way back from detail.
- **Quotations:** organize the editor into client/metadata, line items/totals, terms/payment and preview. Preserve history, saving and export/print. Make save the primary action and keep destructive actions visually separate.
- **Service Pricing:** keep board selection and save prominent; keep editor and preview as explicit modes. Group AI, duplicate, copy/share/export and reset actions so they do not compete with save.
- **Fanpage Planning:** establish brand and plan-period context first, then approval progress and the calendar/table. Keep AI, print/PDF and proposal export available as secondary actions.
- **Video Scripts:** retain Kanban/table, search, platform filters and AI script creation, but make this a direct Content destination. Keep filters in one consistent toolbar.
- **Settings:** organize Studio profile, payment details, integrations and backup/data management into distinct sections. Keep reset in a clearly separated, confirmed data-management area.
- **Client Portal:** preserve its three user-facing areas (progress, package/pricing and quotation) and keep admin-only controls out of the client presentation.

## Design system

Use the **Minimalism & Swiss** direction from UI/UX Pro Max: clear hierarchy, restrained surfaces, functional whitespace and consistent controls. Avoid glass/blur or decoration as a default dashboard treatment.

### Typography

- Prefer **Inter** for headings and body UI; use JetBrains Mono only for codes, identifiers and alignment-sensitive numeric data.
- Initial scale: 12px helper/metadata, 14px labels, 16px default body, 20px section headings and 24–28px page headings.
- Keep essential labels and table content at 12px or larger. Use weight and spacing to express hierarchy instead of all-caps labels everywhere.

### Semantic colors

| Role | Light | Dark |
|---|---|---|
| Background | `#F8FAFC` | `#0B1220` |
| Surface | `#FFFFFF` | `#111827` |
| Text | `#0F172A` | `#F8FAFC` |
| Muted text | `#475569` | `#A1AAB8` |
| Border | `#E2E8F0` | `#334155` |

- Primary action: `#2563EB`; success: `#059669`; warning: `#D97706`; destructive: `#DC2626`.
- Preserve Hủ Design terracotta (`#B4532C`) as a restrained brand accent, not as a second competing primary-action color.
- Status must include text/icon as well as color. Cloud status must reflect actual readiness/sync/error state.
- Define semantic tokens centrally and use them across light and dark themes instead of adding new per-page hex values.

### Spacing and components

- Use a 4/8px spacing rhythm; common gaps 8/12/16/24/32px.
- Use a restrained radius scale: 8px for controls, 12px for cards, 16px for large dialogs. Do not default every element to extra-rounded shapes.
- Buttons need consistent primary, secondary, subtle and destructive variants plus hover, focus, disabled and loading states. One primary CTA per region.
- Inputs need visible labels, consistent height/focus treatment, and adjacent helper/error text.
- Tables should align dates, money and status consistently; long desktop tables may scroll in their own region with a clear affordance. Use stacked cards only where that preserves useful task scanning on narrow screens.
- Use a shared dialog shell with accessible title/description, close/cancel action, Escape handling, managed focus, and a scrollable body with stable actions for long forms.

## Shared UI components to establish or consolidate

- `AppShell`, grouped `Sidebar`, page title/breadcrumb header.
- Global `CreateMenu`, page action toolbar and overflow menu.
- `SearchFilterBar`, semantic `StatusBadge`, empty/loading/error states and truthful cloud status.
- Button variants, labeled `FormField`, tabs/segmented control and reusable confirmation dialog.
- `DialogShell` with keyboard and focus behavior.
- Table/list toolbar and table primitives where the task semantics match; retain Kanban and export/print layouts where they serve their own workflow.

Potential extraction targets include shared patterns in `OverviewDashboard.tsx`, `ClientDesignManager.tsx`, `QuotationGenerator.tsx`, `ServicePricingManager.tsx`, `ContentPlanner.tsx`, `FanpageWeeklyPlanner.tsx`, `MasterCalendarPlanTable.tsx`, `ClientPortalView.tsx` and their existing dialog components. Keep domain logic in place unless a focused refactor is needed; do not change Firestore collections, TypeScript data models or database schema.

## Implementation sequence and verification plan

1. **Navigation and entry points:** implement the grouped IA and global create menu; ensure every create action opens its form; target Video Scripts from the video KPI. Verify every menu, shortcut, dashboard KPI, refresh and back/forward behavior.
2. **Foundation and shared patterns:** add semantic tokens and unify typography, spacing, controls, status chips and dialogs. Verify light/dark contrast, keyboard operation, visible focus, dialog focus/close behavior, error/loading feedback and cloud status truthfulness.
3. **Clients, design work and quotations:** improve directory/detail hierarchy and quotation flow. Smoke-check create/edit/delete client and design work, linked customer navigation, quote create/edit/save/history/preview/print, and client portal preview.
4. **Pricing and content:** declutter toolbars and clarify Fanpage/Video destinations while preserving all existing actions. Smoke-check pricing create/edit/save/duplicate/share/export; plan create/update/approval/post editing/AI/print; video create/edit/status/filter/AI script.
5. **Responsive and regression pass:** check 375, 768, 1024 and 1440px, light/dark, keyboard-only navigation, reduced motion, long tables, narrow toolbar wrap, tall dialogs and empty/error/loading states. Run project typecheck/build and relevant regression tests when implementation begins.

This is a verification plan only; no tests are run as part of this audit document.

## Guardrails for future Codex work

- Read this file before editing UI and keep changes aligned to the approved direction.
- Preserve every existing capability and business workflow. Reorganize entry points without silently dropping actions.
- Do not alter database schema, Firestore collections or data models as part of UI redesign.
- Prefer incremental changes and reuse existing code when it is coherent; extract shared UI when it reduces real inconsistency.
- Do not seed, rewrite or migrate Firebase data while doing visual work.
- Update this document when the user explicitly approves a material design-direction change.
