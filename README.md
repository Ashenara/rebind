# ReBind

ReBind is a premium, highly-optimized, 100% client-side web application designed to reconstruct, clean, merge, and compile multiple EPUB files into a single, cohesive EPUB 3 book. The entire processing pipeline runs locally within your browser, ensuring absolute privacy, zero server uploads, and lightning-fast performance.

> **Note on Screen Resolution:** ReBind's dense, multi-pane workspace is built for power users and is best experienced on a desktop monitor with a **1920px resolution** or higher. If you are using a smaller screen or a laptop, it is highly recommended to zoom out your browser (e.g., `Ctrl` + `-` to 80% or 90%) to get the best view of the workspace.

## 🌟 Key Features

- **100% Local Processing**: All parsing, file unzipping, cleaning, and EPUB generation happens locally in your browser memory using `JSZip` and Web Workers.
- **EPUB Merging**: Combine multiple chapters, volumes, or separate books into one cohesive master file effortlessly.
- **Advanced Text Cleaning & Reformatting**: Automatically strip extraneous HTML wrappers, bloated inline CSS, or weird formatting from poorly made EPUBs.
- **AI-Powered Regex Generator**: Ask the built-in AI to generate complex Regular Expressions to match and strip specific junk text from your EPUBs based on a small sample you provide.
- **Google Drive Sync**: Seamlessly sync your Regex Rules and ReBind Settings to your personal Google Drive (`appDataFolder`) so your preferences travel with you across devices.
- **Auto-Sequence Issue Detection**: The app will automatically scan your merged spine for out-of-order chapters, duplicate numbering, or missing gaps in the sequence and alert you.
- **Virtualized High-Performance Spine**: The chapter list uses TanStack Virtual to easily render and manage EPUBs with thousands of chapters without lagging the DOM.
- **Rich Metadata Editing**: Easily update the Title, Author, Cover Image, and Description of the final generated book.

## 🚀 How to use (Online)

Simply visit [https://rebind.ashenara.com](https://rebind.ashenara.com), drag and drop your EPUB files into the workspace, adjust the chapters, set up any regex cleaners, and click **Generate**!

## 💻 Local Development & Installation

If you want to run ReBind locally on your own machine or contribute to the project, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`
- A Google Cloud Platform Project (if you want to enable the Drive Sync and Gemini AI features locally)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ashenara/rebind.git
   cd rebind
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):
   Create a `.env.local` file in the root directory and add your keys to enable AI and Sync.
   ```env
   VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   VITE_AD_NETWORK="none"
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To build a static version of the app for deployment:

```bash
npm run build
```

This will generate a `dist` folder containing the optimized, production-ready static files. You can host this folder on any static hosting provider like Cloudflare Pages, Vercel, or GitHub Pages.

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks
- **Virtualization**: TanStack Virtual
- **Authentication**: @react-oauth/google
- **EPUB Processing**: JSZip (for reading and writing EPUB archives)
- **Icons**: Lucide React

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
