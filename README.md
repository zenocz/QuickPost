# QuickPost

> A fast, privacy-first, open-source API Client built for modern web developers.

QuickPost is a lightweight, distraction-free REST API client alternative to Postman. Built with speed and developer experience in mind, it allows you to compose HTTP requests, inspect responses in real-time, bypass browser CORS restrictions via Next.js Server Actions, and organize your API collections—all with local-first privacy.

---

## Features

- **Lightning Fast & Modern UI**: Sleek dark mode design optimized for productivity without bloated background services.
- **Full Request Builder**: Support for GET, POST, PUT, DELETE, PATCH, custom headers, query params, and JSON/Form-data body payload.
- **Response Inspector**: Detailed HTTP status badges, response execution timing (in ms), payload size, formatted JSON viewer, and headers breakdown.
- **CORS Proxy via Server Actions**: Solve web browser CORS limitations seamlessly using Next.js Server Actions.
- **Built-in Rate Limiting**: Server Action protection preventing proxy abuse (IP-based limit).
- **Collections & Local History**: Automatically persist past requests locally in your browser storage.
- **Authentication Helpers**: Native support for Bearer Tokens, Basic Auth, and API Keys.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions & React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/zenocz/QuickPost.git
cd QuickPost
npm install
```

Run the development server:

```bash
npm run dev
```

Run test suite:

```bash
npm test
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using QuickPost.

---

## Roadmap

- [x] Initial Next.js 16 & Tailwind CSS v4 bootstrap
- [x] Core TypeScript HTTP data models & type definitions
- [ ] Server Action proxy handler for cross-origin requests
- [ ] IP-based Rate Limiter for Server Action proxy protection
- [ ] Vitest unit tests suite for Server Actions & utilities
- [ ] Responsive dark mode UI layout (Sidebar, Request Editor, Response Panel)
- [ ] Request builder with method selector, query params, headers, and body editor
- [ ] Response viewer with status indicators, execution time metrics, and syntax highlighting
- [ ] Local storage persistence for request history and custom collections
- [ ] Import and export Postman collections (v2.1 JSON)

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
