# State Management Decision: React Dashboard Application

## Context

We are selecting a state management solution for a new React dashboard application with the following characteristics:

- **Heavy server-side data fetching** (primary workload)
- **Some client-side filters** (secondary, lighter workload)
- **Team of 4 mid-level React developers** with 2 years of Redux experience

## Options Evaluated

### Option A: Redux Toolkit

| Aspect | Assessment |
|--------|-----------|
| **Boilerplate** | Moderate. RTK reduces classic Redux boilerplate significantly, but still requires slices, reducers, and dispatch patterns. |
| **Server-state handling** | RTK Query exists but adds another layer of abstraction on top of an already substantial library. Managing cache invalidation, polling, and refetching requires deliberate configuration. |
| **Client-state handling** | Excellent. Redux is purpose-built for complex client-side state. |
| **Learning curve** | Low for this team given 2 years of Redux experience. |
| **Ecosystem** | Mature middleware ecosystem, excellent DevTools, strong community. |
| **Risk** | Over-engineering. Redux was designed for complex client state, but this app's primary challenge is server state. Using Redux for everything means treating server-fetched data as client state, which leads to manual cache management, stale data bugs, and unnecessary re-render coordination. |

### Option B: Zustand

| Aspect | Assessment |
|--------|-----------|
| **Boilerplate** | Minimal. Simple store creation with hooks. |
| **Server-state handling** | No built-in solution. The team would need to build or adopt a separate data-fetching layer, which means either reinventing caching/invalidation logic or pairing Zustand with another library anyway. |
| **Client-state handling** | Good. Clean API for simple to moderate client state. |
| **Learning curve** | Low. Simpler mental model than Redux, easy to pick up. |
| **Ecosystem** | Growing but smaller than Redux. No provider needed is a genuine advantage. |
| **Risk** | Solves only half the problem. For an app dominated by server-side data fetching, Zustand alone leaves the hardest problem (server state) unaddressed. The team would likely end up pairing it with React Query anyway, at which point Zustand is only handling the filters -- and Context can do that without an additional dependency. |

### Option C: React Query + Context

| Aspect | Assessment |
|--------|-----------|
| **Boilerplate** | Low. React Query handles the complex part (server state) with minimal setup. Context handles the simple part (filters) natively. |
| **Server-state handling** | Excellent. React Query is purpose-built for this: automatic caching, background refetching, stale-while-revalidate, pagination, optimistic updates, retry logic, and cache invalidation are all first-class features. |
| **Client-state handling** | Adequate. Context is sufficient for lightweight client state like filter selections, UI toggles, and user preferences. It would become a liability only if client state grew highly complex with frequent updates -- which is not the case here. |
| **Learning curve** | Moderate. The team has no stated React Query experience, so there is ramp-up time. However, React Query's mental model (queries and mutations against a server) maps directly to what this app does, so adoption should be straightforward. |
| **Ecosystem** | React Query (TanStack Query) has mature DevTools, strong documentation, and widespread adoption. |
| **Risk** | If client-side state requirements grow significantly beyond filters (e.g., complex multi-step forms, undo/redo, collaborative editing), Context alone could become insufficient. At that point, Zustand or a similar lightweight store could be introduced for just that slice of state. |

## Analysis

The central question is: **what kind of state dominates this application?**

The answer is server state. The app is a dashboard with heavy data fetching. The client-side state (filters) is simple and well-bounded.

This distinction matters because server state and client state have fundamentally different characteristics:

- **Server state** is asynchronous, shared, has a source of truth outside the app, can become stale, and needs caching/invalidation strategies. Libraries like React Query are designed specifically for these problems.
- **Client state** is synchronous, local to the app, and fully controlled by the user. Redux and Zustand are designed for this.

Using Redux or Zustand as the primary state manager means treating server data as client state -- storing fetched data in a client store, manually tracking loading/error states, building your own cache invalidation, and handling refetching logic. This is the exact class of problem React Query eliminates.

### Team experience consideration

The team's 2 years of Redux experience is a real asset, but it should not be the deciding factor. Mid-level developers with React experience can become productive with React Query within 1-2 weeks. The concepts (queries, mutations, cache keys) are simpler than Redux middleware chains and normalized state shapes. The short-term ramp-up cost is far outweighed by the long-term reduction in bugs and boilerplate related to data fetching.

## Recommendation

**Option C: React Query + Context**

This is the best fit because it matches the architecture to the problem:

1. **React Query** handles the dominant concern (server state) with purpose-built tools: automatic caching, background refetching, stale data management, loading/error states, and DevTools for debugging.
2. **React Context** handles the minor concern (client-side filters) without introducing an additional dependency. Filters are simple, infrequently changing values that Context handles well without performance issues.
3. **No over-engineering.** The team avoids maintaining Redux boilerplate or Zustand stores for problems that React Query solves out of the box.
4. **Clear mental model.** There is an explicit separation: "server data goes through React Query, UI state goes through Context." This reduces ambiguity about where state lives.

### Migration path if needs change

If client-side state complexity grows beyond what Context handles comfortably, the team can introduce Zustand for that specific slice without disrupting the React Query layer. This is a lower-risk evolution than starting with Redux for everything and later trying to extract server state into React Query.

## Summary

| Criterion | Redux Toolkit | Zustand | React Query + Context |
|-----------|:---:|:---:|:---:|
| Server-state fit | Weak | Weak | Strong |
| Client-state fit | Strong | Good | Adequate |
| Match to app profile | Low | Low | High |
| Ramp-up cost | None | Low | Moderate |
| Long-term maintenance | Higher | Moderate | Lower |
| **Overall** | **Not recommended** | **Not recommended** | **Recommended** |
