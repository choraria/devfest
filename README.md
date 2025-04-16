# DevFest Finder

A simple, open-source directory and URL redirector for Google Developer Group (GDG) DevFest events using the `devfe.st` domain.

## Features

- Short, memorable URLs for DevFest events (e.g., `devfe.st/bangalore`)
- Directory listing of all DevFest events globally
- Search and filter functionality
- Dynamic updates without requiring redeployment
- Mechanism for requesting URL updates via GitHub Issues

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Data Storage**: Upstash Redis
- **Deployment**: Vercel
- **Automation**: GitHub Actions for updates

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Upstash Redis account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/googlefordevs/devfest.git
   cd devfest
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with your Upstash Redis credentials:
   ```
   UPSTASH_REDIS_REST_URL=your-redis-url
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   NEXT_PUBLIC_SITE_URL=https://devfe.st
   ```

4. Seed the database with sample data (optional, for development):
   ```
   npm run seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Data Structure

Each redirect entry contains:

### Required Fields:
- `slug`: URL slug (e.g., "bangalore")
- `destinationUrl`: The URL to redirect to
- `devfestDate`: Date of the DevFest event

### Optional Fields:
- `devfestName`: Custom DevFest name
- `gdgChapter`: GDG chapter name
- `city`: City name
- `countryName`: Country name
- `countryCode`: Country code (ISO)
- `latitude`: Geographic coordinates
- `longitude`: Geographic coordinates
- `gdgUrl`: GDG chapter URL
- `updatedBy`: GitHub username of last updater
- `updatedAt`: ISO timestamp of last update

## Requesting URL Updates

To request a URL update:

1. Go to the [Issues page](https://github.com/googlefordevs/devfest/issues/new?assignees=&labels=url-request&template=url_request.yml&title=URL+Request%3A+%5BCity%5D)
2. Fill out the required information
3. Submit the issue

Our GitHub Actions workflow will process the request and update the URL.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Developer Groups (GDG) for organizing DevFest events worldwide
- The open-source community for the tools that make this project possible
