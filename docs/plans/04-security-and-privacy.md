# Security and privacy

## Security posture

The application is a static client that temporarily handles a GitHub access token and renders repository-controlled issue content. Its primary controls are credential minimization, strict destination control, schema validation, safe Markdown behavior, and a restrictive content security policy.

GitHub Pages and GitHub GraphQL are separate trust boundaries. Serving the application from GitHub does not make arbitrary page content or API responses trusted executable code.

## Trust boundaries

| Boundary | Main risks | Required controls |
| --- | --- | --- |
| User to repository dialog | Accidental token persistence or exposure | Password input, no autocomplete, in-memory state, clear on close |
| Browser to GitHub GraphQL | Token disclosure, overbroad requests, stale loads | Fixed HTTPS endpoint, explicit variables, abort controllers, no-store |
| GraphQL response to domain | Schema drift, forged shape, excessive data | Zod validation, bounded connections, safe error messages |
| Issue Markdown to DOM | Script injection, dangerous HTML, tracking content | React Markdown escaping, no raw-HTML plugin, CSP image restrictions |
| Graph export to local file | Credential or hidden-data disclosure | Export domain snapshot only; never include token or request headers |
| Static page to external origins | Script injection, framing, data exfiltration | Restrictive CSP and no third-party runtime services |

## Token lifecycle

1. The user enters a token in the native repository dialog.
2. Submission validates repository input and non-empty token text before network access.
3. The request layer reads the token from the submission and sends it only in the Authorization header to `https://api.github.com/graphql`.
4. On a successful repository load, a React ref holds the trimmed token for lazy issue-body requests.
5. Closing the dialog clears its password input state.
6. Loading demo mode, replacing the repository, unloading the tab, or refreshing the page removes the in-memory value.

The application never writes tokens to:

- URL paths, queries, or fragments.
- Local storage, session storage, IndexedDB, cookies, or caches.
- Console output, telemetry, analytics, errors, exports, screenshots, or generated source maps.
- Repository files, environment files, GitHub Actions, or Pages artifacts.

## Minimum token permissions

For a fine-grained personal access token, grant access only to repositories the user intends to view and use read-only Issues plus required Metadata access. Private repository visibility follows the token's repository selection and organization policy.

The application does not request write operations. A token with broader permissions works but is unnecessary.

## Content security policy

The production document defines a static policy with these properties:

- Default source is self.
- Scripts load from self only.
- Connections allow self and `https://api.github.com` only.
- Images allow self, data URLs, and GitHub avatar hosts used by issue actors.
- Outbound frames and embedded objects are disabled.
- Form actions are disabled.
- Base URI is fixed to self.
- Styles allow self and the inline styles required by Primer's runtime styling and graph label colors.

Any new external runtime dependency requires an explicit threat review and CSP change. Do not broaden origins preemptively.

GitHub Pages cannot add the response-header-only `frame-ancestors` directive. Do not put it in the meta policy, where browsers ignore it. Preventing another site from framing the viewer requires moving delivery behind a host that can emit `Content-Security-Policy: frame-ancestors 'none'`; the static Pages deployment does not claim that control.

## Markdown and links

Render GitHub-flavored Markdown with `react-markdown` and `remark-gfm`. Do not enable `rehype-raw` or another raw-HTML execution path. React escapes text and constructs allowed elements.

Links in issue relationships and the inspector open the canonical GitHub URL in a new tab with `rel="noreferrer"`. Images in Markdown remain constrained by CSP and responsive CSS.

## Request and error handling

- Send GraphQL variables as JSON; never concatenate user input into the query document.
- Validate host and repository segments before any request.
- Use a fixed API endpoint and version header.
- Abort stale repository and issue-body requests.
- Do not echo GraphQL response bodies, request headers, or token-derived values in errors.
- Treat repository-not-found and repository-inaccessible as the same user-facing condition.

## Data minimization

- Bulk loading omits issue bodies.
- Lazy bodies remain in memory only for the current repository snapshot.
- No analytics or telemetry SDK receives repository names, issue titles, or user identity.
- JSON export contains the visible repository metadata and filtered issue domain records only.
- PNG export contains only rendered graph content.

## Security acceptance criteria

- A repository URL is the only application state placed in browser history.
- Closing the repository dialog clears its token field.
- Demo mode clears the active token.
- GraphQL contract tests prove authorization values do not enter errors or snapshots.
- Raw HTML in an issue body cannot execute script or event handlers.
- The production Pages response enforces the documented CSP.
- No third-party origin receives repository data during normal use.
