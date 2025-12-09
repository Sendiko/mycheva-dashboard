# MyCheva Dashboard

MyCheva Dashboard is a modern, responsive web application built to manage various aspects of the MyCheva platform, including user attendances, meetings, forums, assignments, and roadmaps. Use this dashboard to track user progress, manage content, and oversee administrative tasks.

## 🚀 Tech Stack

This project is built with the following technologies:

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Markdown Rendering**: `react-markdown`, `remark-gfm`
-   **HTTP Client**: `axios`

## ✨ Key Features

-   **Dashboard**: Overview of key metrics and activities.
-   **Roadmap**: Visualize and manage project milestones.
-   **Meetings**: Schedule and track meetings.
-   **Attendances**: Monitor user attendance records.
-   **Forums**: Discussion boards for community interaction.
-   **Assignments**: Manage and grade user assignments.

## 🛠️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

Ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (Latest LTS version recommended)
-   npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd mycheva-dashboard
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Configure Environment Variables:**

    Create a `.env.local` or `.env.development` file in the root directory. You will need to define the API base URL:

    ```env
    NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
    ```

    > **Note:** Check `lib/axios.ts` to see how the token injection and base URL are handled.

### Running the Development Server

Start the development server on port `8080`:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

### Building for Production

To create an optimized production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

### Start Production Server

To start the production server:

```bash
npm run start
# or
yarn start
# or
pnpm start
# or
bun start
```

### Linting

To run the linter:

```bash
npm run lint
```

## 📂 Project Structure

```
mycheva-dashboard/
├── app/                 # Next.js App Router pages and layouts
│   ├── dashboard/       # Dashboard routes (assignments, forums, etc.)
│   └── ...
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations (e.g., axios setup)
├── public/              # Static assets (images, fonts, etc.)
├── .env.development     # Development environment variables
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation
```
