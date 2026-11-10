Starts a public preview for Learn by Code when an agent starts work, and requests a refresh after a completed turn. The preview stays available after the agent replies, until its Paseo workspace service is stopped.

Only directories with package name learnbycode and the explicit .paseo/public-preview.json opt-in are eligible. The service publishes a validated static build through cloudflared. It does not publish the source checkout or the Paseo daemon.

Requires Paseo 0.14, Node.js 24, pnpm and cloudflared on the daemon machine. Preview addresses are temporary trycloudflare.com URLs. Anyone who has the URL can read the built site. A stopped service requires an explicit start; the hook respects a stop marker.
