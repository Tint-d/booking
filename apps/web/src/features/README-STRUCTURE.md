# Feature structure (aligned with store feature)

**Note:** `src/features/store` is excluded from the TypeScript build (`tsconfig.app.json`) so the app builds without store dependencies. Remove the store folder when you no longer need it, then remove the `exclude` entry.

---

Use this structure for **booking** and **user** features. React Query is used **directly** (no wrapper libraries).

## Layout

```
features/
  <feature>/                    e.g. bookings, auth (users)
    hooks/
      <domain>/                 e.g. bookings, users
        <domain>.types.ts       # Params, variables, entity types
        use-<entity>.query.ts   # useQuery( { queryKey, queryFn } ) – queryFn uses axios
        use-<entity>-create.mutation.ts
        use-<entity>-delete.mutation.ts
    components/
      <base_feature>/           e.g. booking_section, store_reward
        index.tsx               # Compound root: Feature.Sub = SubComponent
        _context.tsx             # Optional: Provider + useFeatureContext
        header/
          index.tsx             # Feature.Header, Feature.Header.Title, etc.
        body/
          index.tsx             # Feature.Body, Feature.Body.Table, etc.
    pages/                      # Page components that use hooks + compound components
    api/                        # Optional: thin API functions if not in hooks
```

## Hooks (React Query direct)

- **Queries**: `useQuery({ queryKey: ['bookings', userId], queryFn: () => apiClient.get(...).then(r => r.data), enabled: !!userId })`
- **Mutations**: `useMutation({ mutationFn: (vars) => apiClient.post(...).then(r => r.data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }) })`
- No `createQuery` / `createMutation` – use `@tanstack/react-query` only.

## Compound component (base feature)

- Root: `Feature` with `Feature.Header`, `Feature.Body` attached.
- Sub-components get data via `useFeatureContext()` or props.
- Same pattern as `store_reward`: index → \_context, header/, body/.
